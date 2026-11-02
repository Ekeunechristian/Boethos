# Cloud sync and phone reminders (Supabase)

Without these steps Boēthos works fully, on one device only. With them you get:

- your data saved online and kept the same on your phone and computer;
- Poimainō reminders arriving while the app is closed.

It uses your own free Supabase project, so only you can read your data. The steps take about 20 minutes.

## 1. Create the project

1. Go to supabase.com, sign up and create a **New project**. Note the database password somewhere safe.
2. Open **Project Settings → API** and copy two things:
   - the **Project URL** (`https://xxxx.supabase.co`);
   - the **anon public** key.
3. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql` and press **Run**.
4. Open **Authentication → Email Templates → Magic Link** and make sure the email contains `{{ .Token }}`. That is the 6-digit code the app asks for. For example:
   `Your Boēthos code is {{ .Token }}`

## 2. Put the app online

Your phone needs the app at an https address. Run `npm run build` and host the `dist` folder on any static host, for example:

- Netlify: drag and drop the `dist` folder;
- Cloudflare Pages;
- Vercel.

Then add that address in Supabase under **Authentication → URL Configuration → Site URL**.

## 3. Connect and sign in

In Boēthos, open **Account → Cloud and push**:

1. Paste the Project URL and the anon key, then press **Save**.
2. Enter your email and press **Email me a code**, then type the 6-digit code.
3. **The first time on a device,** you choose either "Use the cloud copy" or "Keep this device's copy". Nothing is overwritten without your choice.
4. **After that,** the app saves a few seconds after each change. The cloud icon in the header shows the state:
   - green: saved;
   - amber dot: changes waiting;
   - crossed out: offline, and it will retry when you reconnect.
5. **If two devices change at once,** the app asks you which copy to keep.

Restricted pastoral notes stay on the device unless you tick "Also sync restricted pastoral notes".

## 4. Reminders on your phone (web push)

1. **Make keys (once).** On your computer run `npx web-push generate-vapid-keys`. Keep the private key secret.
2. **Add secrets.** In Supabase open **Edge Functions → Secrets** and add:
   - `VAPID_PUBLIC_KEY`;
   - `VAPID_PRIVATE_KEY`;
   - `VAPID_SUBJECT` (`mailto:` followed by your email);
   - `CRON_SECRET` (any long random string).
3. **Deploy the sender.** With the Supabase CLI, run:

   ```bash
   supabase functions deploy send-reminders --no-verify-jwt
   ```

   The function checks the scheduler's secret and your sign-in token itself.
4. **Schedule it.** Under **Database → Extensions**, enable `pg_cron` and `pg_net`. Then run the commented block at the end of `schema.sql`, with your project ref and `CRON_SECRET` filled in. It runs every 5 minutes.
5. **Install the app on your phone.**
   - Android Chrome: menu → Install app.
   - iPhone (iOS 16.4 or later): Safari → Share → Add to Home Screen. Open it from the home screen, because push only works there.
6. **Turn it on.** In the installed app open **Account → Cloud and push**:
   - paste the VAPID **public** key and press **Save**;
   - press **Turn on push**, then **Send a test push**;
   - lock the phone.
   If "Boēthos: test reminder" arrives, press **Yes, it arrived**. Push is marked verified only then.

How it works:

- Your device works out the next 7 days of reminders, applying your quiet hours, categories and digest setting.
- It stores them in `reminder_queue`. Each entry is an opaque key, a category and a time: no names or notes.
- The sender marks each one as sent before sending it, so a reminder never arrives twice.
- While push is on for a device, the in-app reminder on that device stays quiet, so you don't get both.

## If the test does not arrive

- **On iPhone:** the app must be opened from the home-screen icon, and notifications must be allowed in Settings → Notifications → Boēthos.
- **On Android:** check that Chrome notifications are allowed and that battery saver isn't blocking them.
- **On the server:** in Supabase open **Edge Functions → send-reminders → Logs** and look for errors. A wrong VAPID key pair is the most common cause.
- **Reset the subscription:** press Turn on push again.

## Costs and limits

The Supabase free tier is enough for one person. Supabase may pause free projects after a period of inactivity; your data is kept. If that happens, restore the project from the Supabase dashboard. Regular syncing usually keeps it active. Check Supabase's current free-tier terms.
