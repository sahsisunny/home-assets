import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AssetListScreen } from './src/screens/AssetListScreen';
import { AddAssetMethodScreen } from './src/screens/AddAssetMethodScreen';
import { AddManualAssetScreen } from './src/screens/AddManualAssetScreen';
import { AddDocumentScreen } from './src/screens/AddDocumentScreen';
import { AddServiceScreen } from './src/screens/AddServiceScreen';
import { ScanInvoiceScreen } from './src/screens/ScanInvoiceScreen';
import { ReviewExtractedDataScreen } from './src/screens/ReviewExtractedDataScreen';
import { AssetDetailsScreen } from './src/screens/AssetDetailsScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { RemindersScreen } from './src/screens/RemindersScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { BottomNavBar, TabScreen } from './src/components/BottomNavBar';
import { api } from './src/services/api';

type AppScreen =
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgot_password'
  | 'otp'
  | 'reset_password'
  | 'dashboard'
  | 'assets'
  | 'add_method'
  | 'add_manual'
  | 'add_document'
  | 'add_service'
  | 'scan'
  | 'review'
  | 'asset_details'
  | 'documents'
  | 'reminders'
  | 'more'
  | 'analytics';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [currentTab, setCurrentTab] = useState<TabScreen>('home');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('asset_1');
  const [selectedAssetName, setSelectedAssetName] = useState<string>('Household Asset');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [registeredPhone, setRegisteredPhone] = useState<string>('');

  // Handle Tab navigation from BottomNavBar
  const handleSelectTab = (tab: TabScreen) => {
    setCurrentTab(tab);
    if (tab === 'home') setCurrentScreen('dashboard');
    else if (tab === 'assets') setCurrentScreen('assets');
    else if (tab === 'documents') setCurrentScreen('documents');
    else if (tab === 'reminders') setCurrentScreen('reminders');
    else if (tab === 'more') setCurrentScreen('more');
  };

  const handleOpenAdd = () => {
    setCurrentScreen('add_method');
  };

  const handleOpenAssetDetails = (id: string, name?: string) => {
    setSelectedAssetId(id);
    if (name) setSelectedAssetName(name);
    setCurrentScreen('asset_details');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={currentScreen === 'scan' ? 'light-content' : 'dark-content'} />

      {/* Screen Routing */}
      <View style={styles.screenContainer}>
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onGetStarted={() => setCurrentScreen('register')}
            onLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={() => {
              setCurrentTab('home');
              setCurrentScreen('dashboard');
            }}
            onNavigateRegister={() => setCurrentScreen('register')}
            onForgotPassword={() => setCurrentScreen('forgot_password')}
            onBack={() => setCurrentScreen('welcome')}
          />
        )}

        {currentScreen === 'register' && (
          <RegisterScreen
            onRegisterSubmit={(phone) => {
              setRegisteredPhone(`+91 ${phone}`);
              setCurrentScreen('otp');
            }}
            onNavigateLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'forgot_password' && (
          <ForgotPasswordScreen
            onBack={() => setCurrentScreen('login')}
            onSendResetLink={(id) => {
              setRegisteredPhone(id);
              setCurrentScreen('otp');
            }}
            onNavigateLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'otp' && (
          <OtpScreen
            phoneNumber={registeredPhone}
            onVerifySuccess={() => {
              setCurrentScreen('reset_password');
            }}
            onBack={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'reset_password' && (
          <ResetPasswordScreen
            onBack={() => setCurrentScreen('otp')}
            onResetSuccess={() => {
              setCurrentTab('home');
              setCurrentScreen('dashboard');
            }}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onSelectAsset={(id) => handleOpenAssetDetails(id)}
            onViewAllAssets={() => {
              setCurrentTab('assets');
              setCurrentScreen('assets');
            }}
            onOpenNotifications={() => {
              setCurrentTab('reminders');
              setCurrentScreen('reminders');
            }}
            onOpenMenu={() => {
              setCurrentTab('more');
              setCurrentScreen('more');
            }}
          />
        )}

        {currentScreen === 'assets' && (
          <AssetListScreen
            onBack={() => {
              setCurrentTab('home');
              setCurrentScreen('dashboard');
            }}
            onSelectAsset={(id) => handleOpenAssetDetails(id)}
          />
        )}

        {currentScreen === 'add_method' && (
          <AddAssetMethodScreen
            onBack={() => setCurrentScreen('dashboard')}
            onSelectScan={() => setCurrentScreen('scan')}
            onSelectManual={() => setCurrentScreen('add_manual')}
            onSelectWithoutInvoice={() => setCurrentScreen('add_manual')}
          />
        )}

        {currentScreen === 'add_manual' && (
          <AddManualAssetScreen
            onBack={() => setCurrentScreen('add_method')}
            onSaveAsset={async (assetData) => {
              await api.createAsset(assetData);
              setCurrentTab('assets');
              setCurrentScreen('assets');
            }}
          />
        )}

        {currentScreen === 'add_document' && (
          <AddDocumentScreen
            assetId={selectedAssetId}
            assetName={selectedAssetName}
            onBack={() => setCurrentScreen('asset_details')}
            onSaveDocument={async (docData) => {
              await api.createDocument(docData);
              setCurrentTab('documents');
              setCurrentScreen('documents');
            }}
          />
        )}

        {currentScreen === 'add_service' && (
          <AddServiceScreen
            assetId={selectedAssetId}
            assetName={selectedAssetName}
            onBack={() => setCurrentScreen('asset_details')}
            onSaveService={async (serviceData) => {
              await api.createService(serviceData);
              setCurrentScreen('asset_details');
            }}
          />
        )}

        {currentScreen === 'scan' && (
          <ScanInvoiceScreen
            onBack={() => setCurrentScreen('add_method')}
            onScanComplete={(data) => {
              setExtractedData(data);
              setCurrentScreen('review');
            }}
          />
        )}

        {currentScreen === 'review' && (
          <ReviewExtractedDataScreen
            initialData={extractedData}
            onBack={() => setCurrentScreen('scan')}
            onSaveAsset={async (savedAsset) => {
              const cat = (savedAsset.category || 'electronics').toLowerCase();
              const validCat = ['appliances', 'electronics', 'furniture', 'vehicles', 'equipment', 'other'].includes(cat)
                ? cat
                : 'electronics';
              const price = parseFloat(savedAsset.purchasePrice) || 0;
              await api.createAsset({
                name: savedAsset.productName || savedAsset.name || 'Household Asset',
                categoryId: validCat,
                brand: savedAsset.brand || undefined,
                model: savedAsset.model || undefined,
                serialNumber: savedAsset.serialNumber || undefined,
                purchaseDate: savedAsset.purchaseDate || new Date().toISOString().split('T')[0],
                purchasePrice: price,
                currentValue: price,
                seller: savedAsset.seller || undefined,
                location: 'Home',
                ownership: 'Me',
                warranty: {
                  provider: savedAsset.brand ? `${savedAsset.brand} Warranty` : 'Brand Warranty',
                  endDate: savedAsset.warrantyEndDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
                  status: 'active',
                  validLabel: savedAsset.warrantyValidTill || '12 Months Warranty',
                },
              });
              setCurrentTab('assets');
              setCurrentScreen('assets');
            }}
          />
        )}

        {currentScreen === 'asset_details' && (
          <AssetDetailsScreen
            assetId={selectedAssetId}
            onBack={() => {
              setCurrentTab('assets');
              setCurrentScreen('assets');
            }}
            onAddDocument={() => setCurrentScreen('add_document')}
            onAddService={() => setCurrentScreen('add_service')}
          />
        )}

        {currentScreen === 'documents' && (
          <DocumentsScreen
            onBack={() => setCurrentScreen('dashboard')}
            onAddDocument={() => setCurrentScreen('add_document')}
          />
        )}

        {currentScreen === 'reminders' && (
          <RemindersScreen
            onBack={() => {
              setCurrentTab('home');
              setCurrentScreen('dashboard');
            }}
            onSelectAsset={(id) => handleOpenAssetDetails(id)}
          />
        )}

        {currentScreen === 'more' && (
          <MoreScreen
            onLogout={() => setCurrentScreen('welcome')}
            onSelectTab={(tab) => handleSelectTab(tab as TabScreen)}
          />
        )}

        {currentScreen === 'analytics' && (
          <AnalyticsScreen
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      {['dashboard', 'assets', 'documents', 'reminders', 'more'].includes(currentScreen) && (
        <BottomNavBar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onPressAdd={handleOpenAdd}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
});
