import RegisterForm from "@/app/_components/RegisterForm";
import Link from "next/link";

const Register = () => {
    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Create Account</h1>
            <RegisterForm />
            <p className="text-sm text-gray-600 mt-4">
                Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
            </p>
        </div>
    );
};

export default Register;