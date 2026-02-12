"use server"

import axios from "axios"
import { UserType } from "../_types/user"
import { redirect } from "next/navigation"
import { setSession, deleteSession } from "../_lib/session"

const API_URL = process.env.JSON_SERVER_URL || "http://localhost:3002"

export type ActionState = {
    error?: string;
    success?: string;
};

export const loginAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    console.log(email, password)
    try {
        const response = await axios.get(`${API_URL}/users?email=${email}&password=${password}`)
        const user: UserType = response.data[0]
        if (!user) {
            throw new Error("User not found")
        }
        //set user in the cookies
        //await setSession(user)
        await setSession(user.name, user.email, user.id.toString())
        redirect("/books")
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error("Fail to login");
        }
        throw error;
    }
}

export const registerAction = async (prevState: ActionState | null, formData: FormData): Promise<ActionState> => {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        return { error: "All fields are required" };
    }

    if (password !== confirmPassword) {
        return { error: "Passwords do not match" };
    }

    if (password.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    try {
        // Check if user already exists
        const existingUsers = await axios.get(`${API_URL}/users?email=${email}`);
        if (existingUsers.data.length > 0) {
            return { error: "An account with this email already exists" };
        }

        // Create new user
        const response = await axios.post(`${API_URL}/users`, {
            name,
            email,
            password,
        });

        const user: UserType = response.data;

        // Set session and redirect
        await setSession(user.name, user.email, user.id.toString());
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return { error: "Failed to create account. Please try again." };
        }
        throw error;
    }

    redirect("/books");
}

export const logoutAction = async () => {
    // json-server filtering doesn't have a logout endpoint, so we just redirect
    await deleteSession()
    redirect("/login")
}