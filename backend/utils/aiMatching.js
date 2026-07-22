const https = require('https');

/**
 * Calls Hugging Face Inference API to get a sentence embedding for a given text.
 * Falls back to a simple bag-of-words vector if the API call fails or no key is set,
 * so the matching engine keeps working in dev/offline environments.
 */
const getEmbedding = async (text) => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';

  if (!apiKey) {
    return fallbackEmbedding(text);
  }

  try {
    const response = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    });

    const data = await response.json();

    if (Array.isArray(data) && Array.isArray(data[0])) {
      // Mean-pool token embeddings into a single sentence vector
      return meanPool(data);
    }
    if (Array.isArray(data) && typeof data[0] === 'number') {
      return data;
    }

    return fallbackEmbedding(text);
  } catch (err) {
    console.error('HuggingFace embedding error, using fallback:', err.message);
    return fallbackEmbedding(text);
  }
};

const meanPool = (tokenVectors) => {
  const dim = tokenVectors[0].length;
  const sums = new Array(dim).fill(0);
  tokenVectors.forEach((vec) => vec.forEach((v, i) => (sums[i] += v)));
  return sums.map((s) => s / tokenVectors.length);
};

// Simple deterministic fallback embedding (hashing trick) - keeps dev workflow functional
const fallbackEmbedding = (text, dim = 128) => {
  const vector = new Array(dim).fill(0);
  const words = (text || '').toLowerCase().split(/\W+/).filter(Boolean);
  words.forEach((word) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vector[idx] += 1;
  });
  return vector;
};

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA?.length || !vecB?.length) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Computes a composite match score (0-100) between a gig and a freelancer.
 * Combines: skill text similarity (embeddings) + rating + direct skill overlap.
 */
const computeMatchScore = ({ gigEmbedding, freelancerEmbedding, gigSkills = [], freelancerSkills = [], freelancerRating = 0 }) => {
  const semanticSim = cosineSimilarity(gigEmbedding, freelancerEmbedding); // -1..1

  const freelancerSkillNames = freelancerSkills.map((s) => (s.name || s).toLowerCase());
  const gigSkillNames = gigSkills.map((s) => s.toLowerCase());
  const overlap = gigSkillNames.filter((s) => freelancerSkillNames.includes(s)).length;
  const overlapRatio = gigSkillNames.length ? overlap / gigSkillNames.length : 0;

  const ratingScore = freelancerRating / 5; // 0..1

  // Weighted composite: 50% semantic similarity, 35% direct skill overlap, 15% rating
  const composite = 0.5 * Math.max(semanticSim, 0) + 0.35 * overlapRatio + 0.15 * ratingScore;

  return Math.round(composite * 100);
};

module.exports = { getEmbedding, cosineSimilarity, computeMatchScore };
