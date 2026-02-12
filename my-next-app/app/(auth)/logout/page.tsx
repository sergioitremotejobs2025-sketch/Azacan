import { logoutAction } from "@/app/actions/auth";

const Logout = async () => {
    try {
        await logoutAction()
    } catch (error) {
        console.log(error)
    }
    return null;
};

export default Logout;


