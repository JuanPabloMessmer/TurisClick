

export interface LoginResponse {
  access_token: string;
}

export const authService = {
  // Llama al endpoint real de NestJS
  async login(username: string, password: string): Promise<void> {
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Credenciales inválidas");
    }

    const data = (await response.json()) as LoginResponse;
    localStorage.setItem("token", data.access_token);
  },

  logout(): void {
    localStorage.removeItem("token");
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem("token"));
  },
};
