import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import RequireAuth, { PublicOnly } from './auth/RequireAuth';
import AuthPage from './pages/AuthPage';
import CommentsPage from './pages/CommentsPage';
import CreatePage from './pages/CreatePage';
import EditProfilePage from './pages/EditProfilePage';
import ExplorePage from './pages/ExplorePage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import { MyProfilePage, UserProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="posts/:postId/comments" element={<CommentsPage />} />
          <Route path="profile" element={<MyProfilePage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
          <Route path="u/:userId" element={<UserProfilePage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
