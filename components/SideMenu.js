import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CloseIcon, ContactIcon, EyeOffIcon } from './Icons';

export const SideMenu = ({ isOpen, onClose, onNavigate }) => {
  const [displayName, setDisplayName] = useState('User');

  useEffect(() => {
    const loadName = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_credentials');
        if (stored) {
          const creds = JSON.parse(stored);
          if (creds.name && creds.name.trim().length) {
            setDisplayName(creds.name);
            return;
          }
          if (creds.email) {
            const local = creds.email.split('@')[0] || 'User';
            // replace dots/underscores with spaces and capitalize
            const friendly = local.replace(/[._]/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            setDisplayName(friendly);
            return;
          }
        }
        setDisplayName('User');
      } catch (e) {
        console.warn('Could not load user name', e);
        setDisplayName('User');
      }
    };

    if (isOpen) loadName();
  }, [isOpen]);

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
              <View style={styles.profileContainer}>
                  <Image
                      source={{ uri: "https://placehold.co/100x100/F8C8DC/333333?text=User" }}
                      style={styles.profileImage}
                  />
                  <Text style={styles.profileName}>{displayName}</Text>
              </View>
              <View style={styles.sideMenuNav}>
                  <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('Contacts')}>
                      <ContactIcon color="#374151" />
                      <Text style={styles.sideMenuLinkText}>Emergency Contacts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sideMenuLink} onPress={() => onNavigate('DiscreetMode')}>
                      <EyeOffIcon color="#374151" />
                      <Text style={styles.sideMenuLinkText}>Discreet Mode</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sideMenuLink}
                    onPress={async () => {
                      try {
                        await AsyncStorage.removeItem('@logged_in');
                        onClose();
                        // navigate to Login screen
                        onNavigate('Login');
                      } catch (e) {
                        console.warn('Logout failed', e);
                      }
                    }}
                  >
                    <Text style={[styles.sideMenuLinkText, { color: '#EF4444' }]}>Log out</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Pressable>
    </Modal>
  );
};

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
});