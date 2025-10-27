import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// --- Icons for Login/Signup ---

/**
 * Icon for user-related fields (e.g., Full Name).
 * @param {object} props - Props to pass to the Ionicons component (e.g., style, color).
 */
export const UserIcon = (props) => (
  <Ionicons name="person-outline" size={20} {...props} />
);

/**
 * Icon for email fields.
 * @param {object} props - Props to pass to the Ionicons component (e.g., style, color).
 */
export const MailIcon = (props) => (
  <Ionicons name="mail-outline" size={20} {...props} />
);

/**
 * Icon for phone number fields.
 * @param {object} props - Props to pass to the Ionicons component (e.g., style, color).
 */
export const PhoneIcon = (props) => (
  <Ionicons name="call-outline" size={20} {...props} />
);

/**
 * Icon for password or security-related fields.
 * @param {object} props - Props to pass to the Ionicons component (e.g., style, color).
 */
export const LockIcon = (props) => (
  <Ionicons name="lock-closed-outline" size={20} {...props} />
);

// --- Icons for SideMenu / App Navigation ---

/**
 * Icon for closing modals or menus.
 * @param {object} props - Props to pass to the IonicName component (e.g., style, color).
 */
export const CloseIcon = (props) => (
  <Ionicons name="close" size={24} {...props} />
);

/**
 * Icon for Emergency Contacts link.
 * @param {object} props - Props to pass to the MaterialCommunityIcons component (e.g., style, color).
 */
export const ContactIcon = (props) => (
  <MaterialCommunityIcons name="contacts" size={24} {...props} />
);

/**
 * Icon for Discreet Mode link.
 * @param {object} props - Props to pass to the Ionicons component (e.g., style, color).
 */
export const EyeOffIcon = (props) => (
  <Ionicons name="eye-off-outline" size={24} {...props} />
);

/**
 * Icon for the main app menu (hamburger icon).
 * @param {object} props - Props to pass to the Ionicons component (e.g., style, color).
 */
export const MenuIcon = (props) => (
  <Ionicons name="menu" size={32} {...props} />
);

/**
 * Icon for the settings page.
 * @param {object} props - Props to pass to the Ionicons component (e.g., style, color).
 */
export const SettingsIcon = (props) => (
  <Ionicons name="settings-sharp" size={28} {...props} />
);

/**
 * Icon for the back arrow in headers.
 * @param {object} props - Props to pass to the Ionicons component (e.g., style, color).
 */
export const BackIcon = (props) => (
  <Ionicons name="chevron-back" size={24} {...props} />
);