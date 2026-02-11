import { AuthService } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443';

export class AuthGuard
{
  static async checkAuth(): Promise<boolean>
  {
    const token = AuthService.getToken();
    if (!token)
    {
      this.forceLogout();
      return false;
    }

    try
    {
      const response = await fetch(`${API_URL}/api/auth/verify-session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok)
      {
        this.forceLogout();
        return false;
      }

      const data = await response.json();
      
      if (!data.user || !data.user.id)
      {
        this.forceLogout();
        return false;
      }

      sessionStorage.setItem('current_user', JSON.stringify(data.user));
      return true;
    }
    catch (error)
    {
      console.error('Auth check failed:', error);
      this.forceLogout();
      return false;
    }
  }

  private static forceLogout(): void
  {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('current_user');
    window.location.href = '/';
    window.dispatchEvent(new CustomEvent('force-logout'));
  }

  static async requireAuth(): Promise<boolean>
  {
    const isValid = await this.checkAuth();
    
    if (!isValid)
    {
      alert('Votre session a expiré. Veuillez vous reconnecter.');
      return false;
    }
    
    return true;
  }

}