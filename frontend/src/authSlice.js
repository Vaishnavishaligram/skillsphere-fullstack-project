import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../api/endpoints';

const persistSession = (accessToken, user) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('user', JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

// Bootstraps the session on app load by validating the stored access token.
export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return rejectWithValue('no-token');
  try {
    const { data } = await authApi.getMe();
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  } catch (err) {
    clearSession();
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login({ email, password });
    if (data.twoFactorRequired) {
      return { twoFactorRequired: true, preAuthToken: data.preAuthToken };
    }
    persistSession(data.accessToken, data.user);
    return { twoFactorRequired: false, user: data.user };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async ({ preAuthToken, code }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.verifyTwoFactor({ preAuthToken, code });
      persistSession(data.accessToken, data.user);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Invalid code');
    }
  }
);

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await authApi.register(payload);
    persistSession(data.accessToken, data.user);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } catch (err) {
    // ignore network errors on logout - clear local session regardless
  }
  clearSession();
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: (() => {
      try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    })(),
    loading: true,
  },
  reducers: {
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        if (!action.payload.twoFactorRequired) state.user = action.payload.user;
      })
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { updateUser } = authSlice.actions;
export default authSlice.reducer;
