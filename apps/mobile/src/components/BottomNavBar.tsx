import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@home-assets/tokens';
import { Home, Package, Plus, Bell, FileText } from 'lucide-react-native';

export type TabScreen = 'home' | 'assets' | 'scan' | 'reminders' | 'documents' | 'more';

interface BottomNavBarProps {
  currentTab: TabScreen;
  onSelectTab: (tab: TabScreen) => void;
  onPressAdd: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  onPressAdd,
}) => {
  const activeColor = colors.primary.DEFAULT;
  const inactiveColor = '#94A3B8';

  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.7}
      >
        <Home
          size={22}
          color={currentTab === 'home' ? activeColor : inactiveColor}
          strokeWidth={currentTab === 'home' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, currentTab === 'home' && styles.activeTabLabel]}>Home</Text>
      </TouchableOpacity>

      {/* Assets Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('assets')}
        activeOpacity={0.7}
      >
        <Package
          size={22}
          color={currentTab === 'assets' ? activeColor : inactiveColor}
          strokeWidth={currentTab === 'assets' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, currentTab === 'assets' && styles.activeTabLabel]}>Assets</Text>
      </TouchableOpacity>

      {/* Elevated Center Add (+) Button */}
      <View style={styles.centerButtonWrapper}>
        <TouchableOpacity
          style={styles.centerAddButton}
          onPress={onPressAdd}
          activeOpacity={0.85}
        >
          <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Reminders Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('reminders')}
        activeOpacity={0.7}
      >
        <Bell
          size={22}
          color={currentTab === 'reminders' ? activeColor : inactiveColor}
          strokeWidth={currentTab === 'reminders' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, currentTab === 'reminders' && styles.activeTabLabel]}>Reminders</Text>
      </TouchableOpacity>

      {/* Documents / More Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('documents')}
        activeOpacity={0.7}
      >
        <FileText
          size={22}
          color={currentTab === 'documents' ? activeColor : inactiveColor}
          strokeWidth={currentTab === 'documents' ? 2.5 : 2}
        />
        <Text style={[styles.tabLabel, currentTab === 'documents' && styles.activeTabLabel]}>Docs</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  activeTabLabel: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  centerButtonWrapper: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAddButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    top: -10,
  },
  centerAddIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 30,
  },
});
