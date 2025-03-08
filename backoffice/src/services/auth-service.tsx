export const authService = {
    login: async (username: string, password: string) => {

      return new Promise((resolve) => {
        setTimeout(() => {
          if (username === "superadmin" && password === "super123") {
            localStorage.setItem("token", "dummy_token")
            resolve({ access_token: "dummy_token" })
          } else {
            throw new Error("Credenciales inválidas")
          }
        }, 500)
      })
    },
    logout: () => {
      localStorage.removeItem("token")
    },
    isAuthenticated: () => {
      return !!localStorage.getItem("token")
    },
  }
  
  