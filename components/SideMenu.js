import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Assuming Icons.js is in the same components directory or adjust the path
import { CloseIcon, ContactIcon, EyeOffIcon } from './Icons';

// Use the component signature from the user-uploaded SideMenu.js
export const SideMenu = ({ isOpen, onClose, onNavigate }) => {
  const [displayName, setDisplayName] = useState('User');
  const [profilePicUri, setProfilePicUri] = useState(null); // State for profile picture URI

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_credentials');
        if (stored) {
          const creds = JSON.parse(stored);

          // Load display name logic (from user's SideMenu.js)
          if (creds.name && creds.name.trim().length) {
            setDisplayName(creds.name);
          } else if (creds.email) {
            const local = creds.email.split('@')[0] || 'User';
            const friendly = local.replace(/[._]/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            setDisplayName(friendly);
          } else {
            setDisplayName('User');
          }

          // Load profile picture URI
          if (creds.profilePic) {
            setProfilePicUri(creds.profilePic);
          } else {
            setProfilePicUri(null); // Explicitly set null if not found
          }
          return; // Exit after loading
        }
        // If no credentials found, reset both
        setDisplayName('User');
        setProfilePicUri(null);
      } catch (e) {
        console.warn('Could not load user data', e);
        // Reset on error
        setDisplayName('User');
        setProfilePicUri(null);
      }
    };

    if (isOpen) {
      loadUserData(); // Load both name and picture when menu opens
    }
  }, [isOpen]); // Re-run effect when isOpen changes

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
          {/* Ensure profile container is at the top */}
          <View style={styles.sideMenu}>
              <TouchableOpacity onPress={onClose} style={styles.sideMenuCloseButton}>
                  <CloseIcon />
              </TouchableOpacity>
              {/* Profile section with dynamic image */}
              <View style={styles.profileContainer}>
                  <Image
                      // Use profilePicUri if available, otherwise fallback to placeholder
                      source={
                        profilePicUri
                          ? { uri: profilePicUri }
                          : { uri: "https://placehold.co/100x100/F8C8DC/333333?text=User" }
                      }
                      style={styles.profileImage}
                  />
                  <Text style={styles.profileName}>{displayName}</Text>
              </View>
              {/* Navigation links below profile */}
              <View style={styles.sideMenuNav}>
                  {/* Existing navigation links */}
                  <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('Contacts')}>
                      <ContactIcon color="#374151" />
                      <Text style={styles.sideMenuLinkText}>Emergency Contacts</Text>
                  </TouchableOpacity>
                   <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('JourneySharing')}>
                    <Text style={styles.menuIcon}>📍</Text>
                    <Text style={styles.sideMenuLinkText}>Journey Sharing</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('LocationHistory')}>
                     <Text style={styles.menuIcon}>🗺️</Text>
                     <Text style={styles.sideMenuLinkText}>Location History</Text>
                 </TouchableOpacity>
                  <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('DiscreetMode')}>
                      <EyeOffIcon color="#374151" />
                      <Text style={styles.sideMenuLinkText}>Discreet Mode</Text>
                  </TouchableOpacity>

                  {/* Logout Button (from user's SideMenu.js) */}
                  <TouchableOpacity
                    style={styles.sideMenuLink}
                    onPress={async () => {
                      try {
                        await AsyncStorage.removeItem('@logged_in'); // Clear login flag
                        onClose(); // Close the menu
                        onNavigate('Login'); // Navigate to Login
                      } catch (e) {
                        console.warn('Logout failed', e);
                      }
                    }}
                  >
                    <Text style={[styles.sideMenuLinkText, { color: '#EF4444', marginLeft: 0 }]}>Log out</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Pressable>
    </Modal>
  );
};

// Styles (combination of original and user's SideMenu.js styles)
const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      sideMenu: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '75%',
        maxWidth: 300,
        backgroundColor: 'white',
        padding: 20,
        elevation: 10,
      },
      sideMenuCloseButton: {
        position: 'absolute',
        top: 40, // Adjust for status bar/notch if needed
        right: 20,
        padding: 8,
      },
      profileContainer: {
        marginTop: 64, // Space below close button
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 20,
      },
      profileImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
        marginBottom: 12,
        backgroundColor: '#FEE2E2', // Added placeholder bg color
      },
      profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
      },
      sideMenuNav: {
        marginTop: 20,
      },
      sideMenuLink: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
      },
      sideMenuLinkText: {
        textAlign: 'left',
        fontSize: 18,
        color: '#374151',
        marginLeft: 16, // Space between icon and text
      },
       menuIcon: {
        fontSize: 24,
        width: 24,
        height: 24,
        textAlign: 'center',
      },
});