import { cookies } from "next/headers"
import { UserType } from "../_types/user"
import { redirect } from "next/navigation"


//Set Session cookie
export const setSession = async (name: string, email: string, id: string) => {
    const cookieStore = await cookies()
    cookieStore.set("session", JSON.stringify({ name, email, id }), {
        httpOnly: true,
        secure: process.env.SESSION_SECURE !== "false",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    })
}
//Get Session cookie
export const getSession = async (): Promise<UserType | null> => {
    const cookieStore = await cookies()
    const session = cookieStore.get("session")?.value
    if (!session) {
        return null
    }
    try {
        const user = JSON.parse(session) as UserType
        return user
    } catch (e) {
        console.error("Failed to parse session cookie:", e)
        return null
    }
}


//Delete Session cookie
export const deleteSession = async () => {
    const cookieStore = await cookies()
    cookieStore.delete("session")
}


