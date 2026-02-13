import Link from "next/link";
import React from "react";
import LogoutButton from "./LogoutButton";
import { getSession } from "../_lib/session";
import CartIndicator from "./CartIndicator";


const NavBar = async () => {
    const session = await getSession()
    return (
        <nav className="bg-white shadow-sm">
            <div className="Container mx-auto p-4 flex justify-between items-center">
                <Link href="/" className="text-xl font-extrabold text-gray-900 tracking-tighter flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">AI</div>
                    LibroMind
                </Link>
                {session ? (
                    <div className="flex items-center gap-6">
                        <Link href="/books" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                            My Library
                        </Link>
                        <CartIndicator />
                        <LogoutButton />
                    </div>
                ) : (
                    <Link href="/login" className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors uppercase tracking-widest">Login</Link>
                )}
            </div>
        </nav>
    );
};

export default NavBar;