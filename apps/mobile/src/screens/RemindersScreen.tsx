import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  Clock,
  ShieldCheck,
  Calendar,
  Check,
  X,
  Bell,
  Wrench,
  FileText,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import { colors } from '@home-assets/tokens';
import { api, ReminderData } from '../services/api';

interface RemindersScreenProps {
  onBack?: () => void;
  onSelectAsset?: (assetId: string) => void;
}

const FILTER_TABS = ['All', 'Maintenance', 'Warranty', 'Completed'];

export const RemindersScreen: React.FC<RemindersScreenProps> = ({ onBack, onSelectAsset }) => {
  const [selectedTab, setSelectedTab] = useState('All');
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [summary, setSummary] = useState({ dueToday: 0, thisMonth: 0, warranty: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Add Reminder Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState<'maintenance' | 'warranty' | 'document' | 'general'>('maintenance');

  const loadReminders = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const typeParam = selectedTab === 'Maintenance' ? 'maintenance' : selectedTab === 'Warranty' ? 'warranty' : undefined;
      const statusParam = selectedTab === 'Completed' ? 'completed' : undefined;
      const res = await api.getReminders(statusParam, typeParam);
      setReminders(res.data || []);
      if (res.summary) setSummary(res.summary);
    } catch {
      setReminders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadReminders(true);
  }, [selectedTab]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadReminders(false);
  };

  const handleMarkComplete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.updateReminder(id, { status: 'completed' });
      await loadReminders(false);
    } catch {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Unable to complete reminder.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSnooze = async (id: string, days: number) => {
    setActionLoadingId(id);
    try {
      await api.updateReminder(id, { snoozeDays: days });
      await loadReminders(false);
    } catch {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Unable to snooze reminder.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.deleteReminder(id);
      await loadReminders(false);
    } catch {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Unable to delete reminder.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateReminder = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      await api.createReminder({
        title: newTitle,
        assetName: newAssetName || 'Household Asset',
        dueDate: newDueDate,
        type: newType,
      });
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewAssetName('');
      await loadReminders(false);
    } catch {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Unable to save reminder.');
    } finally {
      setIsCreating(false);
    }
  };

  // Group reminders
  const dueToday = reminders.filter((r) => r.status !== 'completed' && r.categoryGroup === 'due_today');
  const thisMonth = reminders.filter((r) => r.status !== 'completed' && r.categoryGroup === 'this_month');
  const warrantyExpiries = reminders.filter((r) => r.status !== 'completed' && r.type === 'warranty' && r.categoryGroup !== 'due_today');
  const upcomingOthers = reminders.filter(
    (r) => r.status !== 'completed' && r.categoryGroup === 'upcoming' && r.type !== 'warranty'
  );
  const completed = reminders.filter((r) => r.status === 'completed');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={22} color="#1E293B" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Reminders & Actions</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setIsAddModalOpen(true)}>
          <Plus size={22} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
      </View>

      {/* KPI Highlight Strip */}
      <View style={styles.kpiStrip}>
        <View style={[styles.kpiChip, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <Text style={[styles.kpiNumber, { color: '#DC2626' }]}>{summary.dueToday}</Text>
          <Text style={styles.kpiLabel}>Due Today</Text>
        </View>

        <View style={[styles.kpiChip, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
          <Text style={[styles.kpiNumber, { color: '#EA580C' }]}>{summary.thisMonth}</Text>
          <Text style={styles.kpiLabel}>This Month</Text>
        </View>

        <View style={[styles.kpiChip, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <Text style={[styles.kpiNumber, { color: '#D97706' }]}>{summary.warranty}</Text>
          <Text style={styles.kpiLabel}>Warranties</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, selectedTab === tab && styles.tabPillActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reminder List Content */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.DEFAULT]}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Bell size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySub}>
              No pending maintenance or warranty reminders. Tap + to create one.
            </Text>
          </View>
        ) : (
          <>
            {/* Section 1: Due Today / Overdue */}
            {dueToday.length > 0 && selectedTab !== 'Completed' && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeaderRow}>
                  <AlertCircle size={15} color="#DC2626" />
                  <Text style={[styles.sectionHeading, { color: '#DC2626' }]}>Due Today / Overdue</Text>
                  <Text style={styles.sectionCountBadge}>{dueToday.length}</Text>
                </View>
                {dueToday.map((item) => (
                  <ReminderCard
                    key={item.id}
                    reminder={item}
                    actionLoading={actionLoadingId === item.id}
                    onComplete={() => handleMarkComplete(item.id)}
                    onSnooze={(days) => handleSnooze(item.id, days)}
                    onDelete={() => handleDelete(item.id)}
                    onSelectAsset={onSelectAsset}
                  />
                ))}
              </View>
            )}

            {/* Section 2: This Month */}
            {thisMonth.length > 0 && selectedTab !== 'Completed' && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeaderRow}>
                  <Clock size={15} color="#EA580C" />
                  <Text style={[styles.sectionHeading, { color: '#EA580C' }]}>Upcoming This Month</Text>
                  <Text style={styles.sectionCountBadge}>{thisMonth.length}</Text>
                </View>
                {thisMonth.map((item) => (
                  <ReminderCard
                    key={item.id}
                    reminder={item}
                    actionLoading={actionLoadingId === item.id}
                    onComplete={() => handleMarkComplete(item.id)}
                    onSnooze={(days) => handleSnooze(item.id, days)}
                    onDelete={() => handleDelete(item.id)}
                    onSelectAsset={onSelectAsset}
                  />
                ))}
              </View>
            )}

            {/* Section 3: Warranty Expiries */}
            {warrantyExpiries.length > 0 && selectedTab !== 'Completed' && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeaderRow}>
                  <ShieldCheck size={15} color="#D97706" />
                  <Text style={[styles.sectionHeading, { color: '#D97706' }]}>Warranty Expiries</Text>
                  <Text style={styles.sectionCountBadge}>{warrantyExpiries.length}</Text>
                </View>
                {warrantyExpiries.map((item) => (
                  <ReminderCard
                    key={item.id}
                    reminder={item}
                    actionLoading={actionLoadingId === item.id}
                    onComplete={() => handleMarkComplete(item.id)}
                    onSnooze={(days) => handleSnooze(item.id, days)}
                    onDelete={() => handleDelete(item.id)}
                    onSelectAsset={onSelectAsset}
                  />
                ))}
              </View>
            )}

            {/* Section 4: Upcoming Others */}
            {upcomingOthers.length > 0 && selectedTab !== 'Completed' && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeaderRow}>
                  <Calendar size={15} color="#64748B" />
                  <Text style={styles.sectionHeading}>Future Schedules</Text>
                </View>
                {upcomingOthers.map((item) => (
                  <ReminderCard
                    key={item.id}
                    reminder={item}
                    actionLoading={actionLoadingId === item.id}
                    onComplete={() => handleMarkComplete(item.id)}
                    onSnooze={(days) => handleSnooze(item.id, days)}
                    onDelete={() => handleDelete(item.id)}
                    onSelectAsset={onSelectAsset}
                  />
                ))}
              </View>
            )}

            {/* Section 5: Completed */}
            {(selectedTab === 'Completed' || selectedTab === 'All') && completed.length > 0 && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeaderRow}>
                  <Check size={15} color="#059669" />
                  <Text style={[styles.sectionHeading, { color: '#059669' }]}>Completed Reminders</Text>
                </View>
                {completed.map((item) => (
                  <ReminderCard
                    key={item.id}
                    reminder={item}
                    actionLoading={actionLoadingId === item.id}
                    onComplete={() => {}}
                    onSnooze={() => {}}
                    onDelete={() => handleDelete(item.id)}
                    onSelectAsset={onSelectAsset}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Add Reminder CTA */}
      <View style={styles.bottomCtaWrapper}>
        <TouchableOpacity style={styles.addReminderBtn} onPress={() => setIsAddModalOpen(true)} activeOpacity={0.85}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addReminderBtnText}>Add Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* Add Reminder Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reminder Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. AC Filter Clean & Gas Check"
                  placeholderTextColor="#94A3B8"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Linked Asset Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. LG 1.5 Ton AC"
                  placeholderTextColor="#94A3B8"
                  value={newAssetName}
                  onChangeText={setNewAssetName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Due Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={newDueDate}
                  onChangeText={setNewDueDate}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.typeSelectorRow}>
                  {(['maintenance', 'warranty', 'document', 'general'] as const).map((t) => {
                    const Icon = t === 'maintenance' ? Wrench : t === 'warranty' ? ShieldCheck : t === 'document' ? FileText : Bell;
                    const label = t === 'maintenance' ? 'Maint.' : t === 'warranty' ? 'Warranty' : t === 'document' ? 'Doc' : 'General';
                    const isActive = newType === t;
                    const iconColor = isActive ? colors.primary.DEFAULT : '#64748B';
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeSelectPill, isActive && styles.typeSelectPillActive]}
                        onPress={() => setNewType(t)}
                      >
                        <Icon size={14} color={iconColor} />
                        <Text style={[styles.typeSelectText, isActive && styles.typeSelectTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveModalBtn, (!newTitle.trim() || isCreating) && styles.saveModalBtnDisabled]}
                onPress={handleCreateReminder}
                disabled={!newTitle.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Create Reminder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Reminder Card Subcomponent
interface ReminderCardProps {
  reminder: ReminderData;
  actionLoading?: boolean;
  onComplete: () => void;
  onSnooze: (days: number) => void;
  onDelete: () => void;
  onSelectAsset?: (assetId: string) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  actionLoading,
  onComplete,
  onSnooze,
  onDelete,
  onSelectAsset,
}) => {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const isCompleted = reminder.status === 'completed';

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      <View style={styles.cardMain}>
        <View style={styles.iconBox}>
          {reminder.type === 'warranty' ? (
            <ShieldCheck size={20} color="#D97706" />
          ) : reminder.type === 'document' ? (
            <FileText size={20} color="#2563EB" />
          ) : (
            <Wrench size={20} color={colors.primary.DEFAULT} />
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, isCompleted && styles.cardTitleCompleted]}>
            {reminder.title}
          </Text>
          <Text style={styles.cardAsset}>{reminder.assetName || 'Household Asset'}</Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.dueBadge,
                reminder.priority === 'urgent'
                  ? styles.dueBadgeUrgent
                  : isCompleted
                  ? styles.dueBadgeCompleted
                  : styles.dueBadgeUpcoming,
              ]}
            >
              <Text
                style={[
                  styles.dueBadgeText,
                  reminder.priority === 'urgent'
                    ? styles.dueBadgeTextUrgent
                    : isCompleted
                    ? styles.dueBadgeTextCompleted
                    : styles.dueBadgeTextUpcoming,
                ]}
              >
                {reminder.daysLabel || reminder.dueDate}
              </Text>
            </View>
          </View>
        </View>

        {!isCompleted && (
          <TouchableOpacity
            style={styles.checkBtn}
            onPress={onComplete}
            activeOpacity={0.7}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Check size={16} color="#059669" strokeWidth={3} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {!isCompleted && (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.actionLink}
            onPress={() => setShowSnoozeOptions(!showSnoozeOptions)}
            disabled={actionLoading}
          >
            <Clock size={12} color={colors.primary.DEFAULT} />
            <Text style={styles.actionLinkText}>Snooze</Text>
          </TouchableOpacity>

          {reminder.assetId && onSelectAsset && (
            <TouchableOpacity
              style={styles.actionLink}
              onPress={() => onSelectAsset(reminder.assetId!)}
              disabled={actionLoading}
            >
              <Text style={styles.actionLinkText}>View Asset</Text>
              <ChevronRight size={12} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionLink}
            onPress={onDelete}
            disabled={actionLoading}
          >
            <Trash2 size={12} color="#EF4444" />
            <Text style={[styles.actionLinkText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {showSnoozeOptions && !isCompleted && (
        <View style={styles.snoozeMenu}>
          <Text style={styles.snoozeMenuTitle}>Snooze reminder by:</Text>
          <View style={styles.snoozeChipsRow}>
            <TouchableOpacity
              style={styles.snoozeChip}
              onPress={() => {
                onSnooze(7);
                setShowSnoozeOptions(false);
              }}
              disabled={actionLoading}
            >
              <Text style={styles.snoozeChipText}>+7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.snoozeChip}
              onPress={() => {
                onSnooze(14);
                setShowSnoozeOptions(false);
              }}
              disabled={actionLoading}
            >
              <Text style={styles.snoozeChipText}>+14 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.snoozeChip}
              onPress={() => {
                onSnooze(30);
                setShowSnoozeOptions(false);
              }}
              disabled={actionLoading}
            >
              <Text style={styles.snoozeChipText}>+30 Days</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  iconBtn: {
    padding: 4,
  },
  addPlusIcon: {
    fontSize: 22,
    color: colors.primary.DEFAULT,
    fontWeight: '800',
  },
  kpiStrip: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  kpiChip: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabWrapper: {
    marginVertical: 12,
  },
  tabScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabPillActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 90,
  },
  sectionGroup: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    color: '#475569',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompleted: {
    opacity: 0.6,
    backgroundColor: '#F8F9FD',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  cardAsset: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dueBadgeUrgent: {
    backgroundColor: '#FEF2F2',
  },
  dueBadgeUpcoming: {
    backgroundColor: '#FFFBEB',
  },
  dueBadgeCompleted: {
    backgroundColor: '#ECFDF5',
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dueBadgeTextUrgent: {
    color: '#DC2626',
  },
  dueBadgeTextUpcoming: {
    color: '#D97706',
  },
  dueBadgeTextCompleted: {
    color: '#059669',
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkBtnText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '800',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 18,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionLink: {
    paddingVertical: 2,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  snoozeMenu: {
    marginTop: 10,
    backgroundColor: '#F8F9FD',
    padding: 10,
    borderRadius: 10,
  },
  snoozeMenuTitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
  },
  snoozeChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  snoozeChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  snoozeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  bottomCtaWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  addReminderBtn: {
    backgroundColor: colors.primary.DEFAULT,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addReminderBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  centerBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconWrap: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
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
    maxHeight: '85%',
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
  closeBtn: {
    fontSize: 18,
    color: '#64748B',
    padding: 4,
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
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  typeSelectPillActive: {
    backgroundColor: colors.primary.light,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  typeSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  typeSelectTextActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  saveModalBtn: {
    backgroundColor: colors.primary.DEFAULT,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveModalBtnDisabled: {
    opacity: 0.5,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
