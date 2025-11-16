import React from 'react'; // Removed useEffect and useState
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, Image } from 'react-native';
// Removed AsyncStorage, as AuthContext handles it
import { useAuth } from '../context/AuthContext'; // IMPORTED: To get user and logout function
import { CloseIcon, ContactIcon, EyeOffIcon } from './Icons';

export const SideMenu = ({ isOpen, onClose, onNavigate }) => {
  // --- MODIFIED: Get user and logout from AuthContext ---
  const { user, logout } = useAuth(); 

  // --- MODIFIED: Set display name and pic directly from auth user ---
  // Provide fallbacks in case user data is partial
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const profilePicUri = user?.profilePic || null; // Get profile pic URI from user object

  // --- REMOVED: The entire useEffect block that loaded data from AsyncStorage ---

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
          <View style={styles.sideMenu}>
              <TouchableOpacity onPress={onClose} style={styles.sideMenuCloseButton}>
                  <CloseIcon />
              </TouchableOpacity>
              
              {/* Profile section now uses data from AuthContext */}
              <View style={styles.profileContainer}>
                  <Image
                      // Use profilePicUri from context, otherwise fallback to placeholder
                      source={
                        profilePicUri
                          ? { uri: profilePicUri }
                          : { uri: "https://placehold.co/100x100/F8C8DC/333333?text=User" }
                      }
                      style={styles.profileImage}
                  />
                  {/* Use displayName from context */}
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
                   <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('GeofenceManagement')}>
                    <Text style={styles.menuIcon}>🔔</Text>
                    <Text style={styles.sideMenuLinkText}>Geofence Alerts</Text>
                </TouchableOpacity>
                  <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('DiscreetMode')}>
                      <EyeOffIcon color="#374151" />
                      <Text style={styles.sideMenuLinkText}>Discreet Mode</Text>
                  </TouchableOpacity>

                  {/* --- MODIFIED: Logout Button --- */}
                  <TouchableOpacity
                    style={styles.sideMenuLink}
                    onPress={async () => {
                      onClose(); // Close the menu
                      logout(); // Call logout from AuthContext
                      // Navigation to 'Login' is now handled by App.js
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

// Styles remain the same
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
        top: 40, 
        right: 20,
        padding: 8,
      },
      profileContainer: {
        marginTop: 64, 
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
        backgroundColor: '#FEE2E2', 
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
        marginLeft: 16, 
      },
       menuIcon: {
        fontSize: 24,
        width: 24,
        height: 24,
        textAlign: 'center',
      },
});