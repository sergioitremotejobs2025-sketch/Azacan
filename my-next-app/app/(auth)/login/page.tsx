import LoginForm from "@/app/_components/LoginForm";
import Link from "next/link";

const Login = () => {
    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Login</h1>
            <LoginForm />
            <p className="text-sm text-gray-600 mt-4">
                Don't have an account? <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
            </p>
        </div>
    );
};

export default Login;
