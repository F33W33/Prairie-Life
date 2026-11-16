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
