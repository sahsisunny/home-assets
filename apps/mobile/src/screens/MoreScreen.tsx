import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@home-assets/tokens';
import {
  User,
  Crown,
  Shield,
  Download,
  RefreshCw,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { api } from '../services/api';

interface MoreScreenProps {
  onLogout: () => void;
  onSelectTab?: (tab: string) => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onLogout }) => {
  const [warrantyAlerts, setWarrantyAlerts] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Dynamic user & household state
  const [userProfile, setUserProfile] = useState<{ fullName: string; email: string; phone?: string; role?: string } | null>(null);
  const [household, setHousehold] = useState<{ id: string; name: string; plan: string; members: any[] } | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member'>('Member');
  const [isInviting, setIsInviting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMoreData = async () => {
    try {
      const [hhData, meData] = await Promise.all([
        api.getHousehold().catch(() => null),
        api.getMe().catch(() => null),
      ]);

      if (meData?.user) {
        setUserProfile(meData.user);
      }
      if (hhData) {
        setHousehold(hhData);
        setMembers(hhData.members || []);
      }
    } catch (err) {
      console.error('Failed to load household in MoreScreen:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoreData();
  }, []);

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      if (Platform.OS !== 'web') Alert.alert('Missing Info', 'Please enter a name and email/phone.');
      return;
    }
    setIsInviting(true);
    try {
      const newMem = await api.inviteHouseholdMember({
        name: inviteName.trim(),
        emailOrPhone: inviteEmail.trim(),
        role: inviteRole,
      });

      if (newMem) {
        setMembers((prev) => [...prev, newMem]);
      } else {
        await fetchMoreData();
      }

      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      if (Platform.OS !== 'web') {
        Alert.alert('Invitation Sent', `Invite sent to ${inviteEmail}`);
      }
    } catch (err: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Invite Error', err.message || 'Could not send invitation.');
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const exportData = await api.getAnalytics();
      if (Platform.OS !== 'web') {
        Alert.alert('Data Exported', 'Your household asset records and document metadata have been prepared.');
      }
    } catch (err: any) {
      if (Platform.OS !== 'web') Alert.alert('Export Error', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await fetchMoreData();
      if (Platform.OS !== 'web') {
        Alert.alert('Cache Cleared', 'Offline asset cache refreshed.');
      }
    } finally {
      setIsClearing(false);
    }
  };

  const handleLogoutPress = async () => {
    try {
      await api.logout();
    } finally {
      onLogout();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <User size={26} color={colors.primary.DEFAULT} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile?.fullName || 'Household Owner'}
            </Text>
            <Text style={styles.profileContact}>
              {userProfile?.email || (userProfile?.phone ? `+91 ${userProfile.phone}` : 'Active Account')}{userProfile?.email && userProfile?.phone ? ` • +91 ${userProfile.phone}` : ''}
            </Text>
            <View style={styles.roleBadge}>
              <Crown size={12} color={colors.primary.DEFAULT} />
              <Text style={styles.roleBadgeText}>
                {userProfile?.role || 'Household Owner'}
              </Text>
            </View>
          </View>
        </View>

        {/* Household Sharing Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {household?.name || (userProfile?.fullName ? `${userProfile.fullName}'s Home` : "My Household")}
              </Text>
              <Text style={styles.sectionSub}>
                Family Household • {members.length} {members.length === 1 ? 'Member' : 'Members'}
              </Text>
            </View>
            <TouchableOpacity style={styles.inviteBtn} onPress={() => setIsInviteModalOpen(true)}>
              <Text style={styles.inviteBtnText}>+ Invite</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.membersList}>
            {members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  {m.role === 'Owner' || m.type === 'owner' ? (
                    <Crown size={18} color="#D97706" />
                  ) : m.role === 'Admin' || m.type === 'admin' ? (
                    <Shield size={18} color={colors.primary.DEFAULT} />
                  ) : (
                    <User size={18} color="#64748B" />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberEmail}>{m.emailOrPhone || m.email}</Text>
                </View>
                <View style={styles.memberRoleTag}>
                  <Text style={styles.memberRoleText}>{m.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Notifications & Reminders Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <Text style={styles.sectionSub}>Manage proactive maintenance and warranty reminders</Text>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Warranty Expiry Alerts</Text>
              <Text style={styles.settingDesc}>30 days, 7 days & 1 day before expiration</Text>
            </View>
            <Switch
              value={warrantyAlerts}
              onValueChange={setWarrantyAlerts}
              trackColor={{ false: '#CBD5E1', true: colors.primary.DEFAULT }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Maintenance Schedules</Text>
              <Text style={styles.settingDesc}>Reminders for scheduled appliance servicing</Text>
            </View>
            <Switch
              value={maintenanceAlerts}
              onValueChange={setMaintenanceAlerts}
              trackColor={{ false: '#CBD5E1', true: colors.primary.DEFAULT }}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Weekly Household Summary</Text>
              <Text style={styles.settingDesc}>Weekly digest of pending actions & coverage</Text>
            </View>
            <Switch
              value={weeklyDigest}
              onValueChange={setWeeklyDigest}
              trackColor={{ false: '#CBD5E1', true: colors.primary.DEFAULT }}
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <TouchableOpacity style={styles.menuRow} onPress={handleExportData} disabled={isExporting}>
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            ) : (
              <Download size={18} color={colors.primary.DEFAULT} />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Export Household Data</Text>
              <Text style={styles.menuSub}>Download all assets, documents, and service history</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleClearCache}
            disabled={isClearing}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            ) : (
              <RefreshCw size={18} color={colors.primary.DEFAULT} />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>Clear Local Cache</Text>
              <Text style={styles.menuSub}>Free up local storage and re-sync records</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Invite Member Modal */}
      <Modal visible={isInviteModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Household Member</Text>
              <TouchableOpacity onPress={() => setIsInviteModalOpen(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Priya Sharma"
                  placeholderTextColor="#94A3B8"
                  value={inviteName}
                  onChangeText={setInviteName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address or Mobile</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="name@example.com or 98765 43210"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Permission Role</Text>
                <View style={styles.roleSelectRow}>
                  <TouchableOpacity
                    style={[styles.rolePill, inviteRole === 'Admin' && styles.rolePillActive]}
                    onPress={() => setInviteRole('Admin')}
                  >
                    <Text style={[styles.roleText, inviteRole === 'Admin' && styles.roleTextActive]}>
                      Admin (Can Add & Edit)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rolePill, inviteRole === 'Member' && styles.rolePillActive]}
                    onPress={() => setInviteRole('Member')}
                  >
                    <Text style={[styles.roleText, inviteRole === 'Member' && styles.roleTextActive]}>
                      Member (View & Add)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.sendInviteBtn,
                  (!inviteName || !inviteEmail || isInviting) && styles.sendInviteBtnDisabled,
                ]}
                onPress={handleInvite}
                disabled={!inviteName || !inviteEmail || isInviting}
              >
                {isInviting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendInviteText}>Send Invitation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  profileContact: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF0FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inviteBtn: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  inviteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  membersList: {
    marginTop: 4,
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  memberEmail: {
    fontSize: 11,
    color: '#94A3B8',
  },
  memberRoleTag: {
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberRoleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  settingDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalForm: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#1E293B',
  },
  roleSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: colors.primary.light,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  roleTextActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  sendInviteBtn: {
    backgroundColor: colors.primary.DEFAULT,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  sendInviteBtnDisabled: {
    opacity: 0.5,
  },
  sendInviteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
