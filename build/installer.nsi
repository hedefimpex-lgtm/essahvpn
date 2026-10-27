Unicode true
!include "MUI2.nsh"
Name "Essah VPN"
OutFile "${PROJECT_DIR}\dist\EssahInstaller.exe"
InstallDir "$LOCALAPPDATA\Programs\Essah VPN"
RequestExecutionLevel user
SetCompressor /SOLID lzma
!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Turkish"
Section "Essah VPN" SEC_MAIN
  SetOutPath "$INSTDIR"
  File /r "${PROJECT_DIR}\dist\win-unpacked\*.*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Essah VPN"
  CreateShortcut "$SMPROGRAMS\Essah VPN\Essah VPN.lnk" "$INSTDIR\Essah VPN.exe"
  CreateShortcut "$DESKTOP\Essah VPN.lnk" "$INSTDIR\Essah VPN.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EssahVPN" "DisplayName" "Essah VPN"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EssahVPN" "DisplayVersion" "0.1.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EssahVPN" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EssahVPN" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EssahVPN" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EssahVPN" "NoRepair" 1
SectionEnd
Section "Uninstall"
  MessageBox MB_OKCANCEL "VPN bağlıysa önce Essah VPN içinden bağlantıyı kesin. Uygulama kaldırıldığında WireGuard servisi ve kişisel ayarlarınız silinmez." IDOK +2
  Abort
  Delete "$DESKTOP\Essah VPN.lnk"
  Delete "$SMPROGRAMS\Essah VPN\Essah VPN.lnk"
  RMDir "$SMPROGRAMS\Essah VPN"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EssahVPN"
  !include "${PROJECT_DIR}\build\generated-uninstall.nsh"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
SectionEnd
