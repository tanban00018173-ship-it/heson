import Home from './pages/Home';
import About from './pages/About';
import FAQ from './pages/FAQ';
import BookingForm from './pages/BookingForm';
import ClientDashboard from './pages/ClientDashboard';
import ClientHistory from './pages/ClientHistory';


export const PAGES = {
    "Home": Home,
    "About": About,
    "FAQ": FAQ,
    "BookingForm": BookingForm,
    "ClientDashboard": ClientDashboard,
    "ClientHistory": ClientHistory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};