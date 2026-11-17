# Prairie Life online character accounts

The welcome/login screen and character creator are in `prairie-life.html`. Online accounts need a Supabase project before cross-device saves can work.

## One-time setup

1. Create a Supabase project.
2. In the Supabase dashboard, open **SQL Editor**, create a query, paste the contents of `supabase-setup.sql`, and run it.
3. In **Authentication → Providers → Email**, enable Email. Turn **Confirm email** off. Prairie Life uses a character name as the login ID and creates a private, app-generated sign-in address; players do not enter an email address.
4. In **Project Settings → API**, copy the Project URL and the public anon/publishable key. Never use the service-role key in the game.
5. In `prairie-life.html`, replace the two placeholders near `SUPABASE_URL` and `SUPABASE_ANON_KEY` with those values.
6. Commit the change and wait for the site to redeploy.

## Security notes

- The public anon key is intended for browser use; the service-role key is not.
- The `player_saves` table uses row-level security so an authenticated player can read or change only the save associated with their own account ID.
- Passwords are handled by Supabase Auth and are not stored in the game save.
- Character names are case-insensitive for login. Passwords should be unique and kept private.
- Until the Supabase project and keys are configured, the game displays an explanatory message and does not pretend that online accounts are active.

## Current save model

The game keeps a local browser copy for resilience and syncs the complete game state to `player_saves.save_data` after login. The same character account can then load that save on another device.

## Permanent account deletion

Prairie Life includes a **Delete Account** flow. Before it can work in the live game, deploy its Supabase Edge Function:

1. Install and sign in to the [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Link the CLI to this Supabase project: `supabase link --project-ref wmetosdmarxvhaysgyxw`.
3. From the repository root, deploy the function: `supabase functions deploy delete-account`.
4. In Supabase Dashboard → **Edge Functions**, confirm that `delete-account` is deployed.

The function verifies the player's signed-in access token on the server, then uses the server-side Supabase service-role secret to delete that Auth user. The existing `player_saves.user_id` foreign key uses `ON DELETE CASCADE`, so the associated cloud save is deleted automatically. The service-role secret is never placed in the browser code.

Players must enter their character account name and password again in the confirmation dialog. Deletion cannot be undone. The current device's local save is cleared after the server confirms deletion. Other devices may still have an old local browser copy; they cannot use the deleted account to sign in or sync it, and that local browser data is not remotely erased by this function.

**Important:** The HTML confirmation screen is in place, but account deletion will not complete until the Edge Function has been deployed to Supabase.


## Account deletion (required for the Delete Account button)

The repository includes the Edge Function at `supabase/functions/delete-account/index.ts`. It verifies the caller's Supabase session, then uses the server-only service-role key to delete only that authenticated user's Auth account. The `player_saves.user_id` foreign key uses `ON DELETE CASCADE`, so the cloud save is deleted with the account.

Deploy this function to the same Supabase project before enabling account deletion:

1. In the Supabase dashboard, open **Edge Functions** and choose **Deploy a new function** (or create a function named `delete-account`).
2. Deploy the contents of `supabase/functions/delete-account/index.ts` as the function source. If using the Supabase CLI instead, from the repository folder run `supabase functions deploy delete-account` after linking the project.
3. The function uses Supabase's built-in server environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Confirm these are available to the function in the project's Edge Function secrets/settings. **Never paste the service-role key into `prairie-life.html`, GitHub client-side code, or a browser.**
4. In **Edge Functions → delete-account → Logs**, check for deployment/runtime errors if a deletion attempt fails.

The in-game flow asks for the character account name and password, re-authenticates with Supabase, and calls this function using the resulting session. On success it clears the current device's local save and signs out. Other devices may retain an old browser cache until their next login; when an account has no cloud save, Prairie Life now clears that device's stale local save instead of importing it into a new character.
