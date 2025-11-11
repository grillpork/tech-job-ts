"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Bell,
  Lock,
  Palette,
  Database,
  Globe,
  Mail,
  Shield,
  Clock,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);

  // General Settings State
  const [companyName, setCompanyName] = useState("Tech Job Management");
  const [companyEmail, setCompanyEmail] = useState("admin@techjob.com");
  const [timezone, setTimezone] = useState("Asia/Bangkok");
  const [language, setLanguage] = useState("th");

  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [jobAssignedNotif, setJobAssignedNotif] = useState(true);
  const [jobCompleteNotif, setJobCompleteNotif] = useState(true);
  const [userRegistrationNotif, setUserRegistrationNotif] = useState(true);
  const [dailyReportEmail, setDailyReportEmail] = useState(false);

  // Security Settings State
  const [passwordExpireDays, setPasswordExpireDays] = useState("90");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [loginAttempts, setLoginAttempts] = useState("5");

  // Appearance Settings State
  const [theme, setTheme] = useState("system");
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [showCompanyLogo, setShowCompanyLogo] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    console.log("Settings saved:", {
      companyName,
      timezone,
      language,
      emailNotifications,
      twoFactorEnabled,
      theme,
    });
  };

  const settingsTabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "system", label: "System", icon: Database },
  ];

  return (
    <div className="h-full p-4 md:p-8">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your system configuration and preferences</p>
        </div>

        {/* Saved Notification */}
        {saved && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Settings saved successfully</span>
          </div>
        )}

        <div className="flex flex-col">
          {/* Sidebar Tabs */}
          <div className="w-fit">
            <nav className="flex rounded-lg border bg-background p-2">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-4 space-y-6">
            {/* General Settings */}
            {activeTab === "general" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>Update your company details and regional settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input
                          id="company-name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Your company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company-email">Company Email</Label>
                        <Input
                          id="company-email"
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          placeholder="admin@company.com"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger id="timezone">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                            <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</SelectItem>
                            <SelectItem value="Asia/Singapore">Asia/Singapore (GMT+8)</SelectItem>
                            <SelectItem value="Asia/Manila">Asia/Manila (GMT+8)</SelectItem>
                            <SelectItem value="Australia/Sydney">Australia/Sydney (GMT+11)</SelectItem>
                            <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger id="language">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="th">ไทย (Thai)</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="vi">Tiếng Việt (Vietnamese)</SelectItem>
                            <SelectItem value="lo">ລາວ (Lao)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Business Hours</CardTitle>
                    <CardDescription>Set your organization's working hours</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-time">Start Time</Label>
                        <Input id="start-time" type="time" defaultValue="09:00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time">End Time</Label>
                        <Input id="end-time" type="time" defaultValue="17:00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Working Days</Label>
                      <div className="flex gap-2 flex-wrap">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                          <Badge key={day} variant={day !== "Sat" && day !== "Sun" ? "default" : "outline"}>
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Control how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Enable Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive email notifications for all events</p>
                      </div>
                      <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">Job Assignment Notifications</p>
                          <p className="text-sm text-muted-foreground">Notify when job is assigned to user</p>
                        </div>
                        <Switch checked={jobAssignedNotif} onCheckedChange={setJobAssignedNotif} disabled={!emailNotifications} />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">Job Completion Notifications</p>
                          <p className="text-sm text-muted-foreground">Notify when job is completed</p>
                        </div>
                        <Switch checked={jobCompleteNotif} onCheckedChange={setJobCompleteNotif} disabled={!emailNotifications} />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">User Registration Notifications</p>
                          <p className="text-sm text-muted-foreground">Notify when new user registers</p>
                        </div>
                        <Switch checked={userRegistrationNotif} onCheckedChange={setUserRegistrationNotif} disabled={!emailNotifications} />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">Daily Report Email</p>
                          <p className="text-sm text-muted-foreground">Receive daily summary at 8:00 AM</p>
                        </div>
                        <Switch checked={dailyReportEmail} onCheckedChange={setDailyReportEmail} disabled={!emailNotifications} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notification Recipients</CardTitle>
                    <CardDescription>Who should receive critical alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Admin Email Address</Label>
                      <Input id="admin-email" type="email" value={companyEmail} placeholder="admin@company.com" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Password Policy</CardTitle>
                    <CardDescription>Set password requirements for all users</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password-expire">Password Expiration (days)</Label>
                      <Input
                        id="password-expire"
                        type="number"
                        value={passwordExpireDays}
                        onChange={(e) => setPasswordExpireDays(e.target.value)}
                        min="0"
                        placeholder="90"
                      />
                      <p className="text-xs text-muted-foreground">Set to 0 to disable password expiration</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-attempts">Maximum Login Attempts</Label>
                      <Input
                        id="login-attempts"
                        type="number"
                        value={loginAttempts}
                        onChange={(e) => setLoginAttempts(e.target.value)}
                        min="1"
                        placeholder="5"
                      />
                      <p className="text-xs text-muted-foreground">User account will be locked after this many failed attempts</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Require additional verification for user accounts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Enable 2FA for Admin</p>
                        <p className="text-sm text-muted-foreground">Require authenticator app or SMS code</p>
                      </div>
                      <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Session Management</CardTitle>
                    <CardDescription>Control user session duration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        min="5"
                        placeholder="30"
                      />
                      <p className="text-xs text-muted-foreground">User will be logged out after inactivity</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Theme Settings</CardTitle>
                    <CardDescription>Customize the application appearance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme Mode</Label>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger id="theme">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Display Preferences</CardTitle>
                    <CardDescription>Adjust how data is displayed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="items-per-page">Items Per Page</Label>
                      <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                        <SelectTrigger id="items-per-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Show Company Logo</p>
                        <p className="text-sm text-muted-foreground">Display logo in navigation bar</p>
                      </div>
                      <Switch checked={showCompanyLogo} onCheckedChange={setShowCompanyLogo} />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* System Settings */}
            {activeTab === "system" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Database & Backup</CardTitle>
                    <CardDescription>Manage data storage and backups</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="rounded-lg border p-4">
                        <p className="font-medium">System Database</p>
                        <p className="text-sm text-muted-foreground mt-1">PostgreSQL v14.2</p>
                      </div>
                      <Button variant="outline" className="w-full">
                        Create Backup Now
                      </Button>
                      <Button variant="outline" className="w-full">
                        View Backup History
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Integrations</CardTitle>
                    <CardDescription>Connect external services</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Slack Integration</p>
                        <p className="text-sm text-muted-foreground">Send notifications to Slack</p>
                      </div>
                      <Badge variant="outline">Not Connected</Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Google Calendar Sync</p>
                        <p className="text-sm text-muted-foreground">Sync jobs with Google Calendar</p>
                      </div>
                      <Badge variant="outline">Not Connected</Badge>
                    </div>

                    <Button variant="outline" className="w-full">
                      Manage Integrations
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Information</CardTitle>
                    <CardDescription>View system details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Application Version</p>
                        <p className="font-medium">1.0.0</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">Nov 11, 2025</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="font-medium">24</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active Jobs</p>
                        <p className="font-medium">18</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
