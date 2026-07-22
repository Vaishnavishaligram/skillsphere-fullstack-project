import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login');
      return;
    }
    localStorage.setItem('accessToken', token);

    authApi
      .getMe()
      .then(({ data }) => {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard'; // full reload so AuthContext re-bootstraps
      })
      .catch(() => navigate('/login'));
  }, [searchParams, navigate]);

  return <LoadingSpinner label="Signing you in" />;
};

export default OAuthSuccess;
