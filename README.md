# 1st Sault Ste. Marie Scout Group Website

## Included
- Responsive public website
- Firebase-powered sections, events and announcements
- Apple Day fundraiser progress
- Protected administration dashboard
- Email/password login and password reset
- Signed-in password changes
- Firestore security rules
- GitHub Pages and Firebase Hosting compatibility

## Upload to GitHub Pages
1. Extract this ZIP.
2. Upload the contents of the extracted folder to the root of your GitHub repository.
3. Open repository **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select the main branch and `/ (root)`.
6. In Firebase, open **Authentication → Settings → Authorized domains**.
7. Add your GitHub Pages hostname, for example `username.github.io`.

Public site: `index.html`  
Administration: `admin.html`

## User access
Create accounts manually in Firebase Authentication. Each authorized UID requires a matching `users/{UID}` document containing:
- `active` Boolean
- `displayName` String
- `email` String
- `role` String: `owner`, `administrator`, or `editor`

## Firestore rules
The rules are included in `firestore.rules`. Paste them into **Firestore Database → Rules** and publish.

## Indexes
Firebase may prompt you to create composite indexes:
- `events`: `published` ascending + `start` ascending
- `announcements`: `published` ascending + `createdAt` descending

Use the direct link shown in the Firebase error message to create each index.

## Branding
The current header uses a text-based group mark because an official Scouts Canada logo file was not supplied. Replace it only with an authorized official logo.

## Security
The browser Firebase configuration is already installed. Never upload a service-account file, private key, Firebase Admin credentials or passwords.
