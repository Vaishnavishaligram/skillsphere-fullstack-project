import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, verifyTwoFactor, registerUser, logoutUser, updateUser } from '../store/authSlice';

// Session state now lives in Redux (see store/authSlice.js) per the updated
// tech stack. This file is kept as a thin compatibility layer so every page
// that already does `import { useAuth } from '../context/AuthContext'`
// keeps working unchanged - only the internals moved from Context to Redux.
//
// AuthProvider is now a no-op passthrough: the actual Provider is
// react-redux's <Provider store={store}> in main.jsx. Session bootstrapping
// (validating the stored token on load) happens once in App.jsx via the
// fetchMe thunk.
export const AuthProvider = ({ children }) => children;

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const login = useCallback(
    async (email, password) => {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      return result; // { twoFactorRequired, preAuthToken? } or { twoFactorRequired: false, user }
    },
    [dispatch]
  );

  const verifyTwoFactorCode = useCallback(
    async (preAuthToken, code) => {
      return dispatch(verifyTwoFactor({ preAuthToken, code })).unwrap();
    },
    [dispatch]
  );

  const register = useCallback(
    async (payload) => {
      return dispatch(registerUser(payload)).unwrap();
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser()).unwrap();
  }, [dispatch]);

  const updateUserLocal = useCallback(
    (partial) => {
      dispatch(updateUser(partial));
    },
    [dispatch]
  );

  return {
    user,
    loading,
    login,
    verifyTwoFactor: verifyTwoFactorCode,
    register,
    logout,
    updateUser: updateUserLocal,
  };
};
