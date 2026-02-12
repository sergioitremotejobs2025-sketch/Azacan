"use client";
import React from "react";
import { logoutAction } from "../actions/auth";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";

const LogoutButton = () => {
    const router = useRouter();
    const handleLogout = async () => {
        try {
            await logoutAction()
            //The redirect happens in the server action
            //So we don't need to do anything here
            //But if we want to redirect to the login page
            //We can do it here
            //window.location.href = "/login"
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.log("Logout failed :", error)
        }
    }
    return (
        <button className="text-lg font-bold text-white bg-red-500 px-4 py-2 rounded hover:bg-red-900 transition-colors cursor-pointer" onClick={handleLogout}>Logout</button>
    );
};

export default LogoutButton;