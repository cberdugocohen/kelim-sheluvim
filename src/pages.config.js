import Admin from './pages/Admin';
import CommunityCenter from './pages/CommunityCenter';
import CommunityHub from './pages/CommunityHub';
import Events from './pages/Events';
import Home from './pages/HomeNew';
import MyMessages from './pages/MyMessages';
import Notifications from './pages/Notifications';
import PrayerRequests from './pages/PrayerRequests';
import Profile from './pages/Profile';
import Services from './pages/Services';
import SpotlightProfile from './pages/SpotlightProfile';
import SpotlightRequestForm from './pages/SpotlightRequestForm';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "CommunityCenter": CommunityCenter,
    "CommunityHub": CommunityHub,
    "Events": Events,
    "Home": Home,
    "MyMessages": MyMessages,
    "Notifications": Notifications,
    "PrayerRequests": PrayerRequests,
    "Profile": Profile,
    "Services": Services,
    "SpotlightProfile": SpotlightProfile,
    "SpotlightRequestForm": SpotlightRequestForm,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
