# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c72bd105-8134-406f-8d24-e609c43ca3b0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c72bd105-8134-406f-8d24-e609c43ca3b0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Running tests

Unit tests are executed with [Vitest](https://vitest.dev/):

```sh
npm test
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Environment variables

The Supabase client relies on two environment variables:

- `SUPABASE_URL` – URL of your Supabase instance
- `SUPABASE_PUBLISHABLE_KEY` – the project's public API key

Both variables must be available via Vite's `import.meta.env` system (for
example by placing them in a `.env` file). The application will throw an error
at startup if either one is missing.

An `.env.example` file is included in the repository. Copy it to `.env` and
add your Supabase credentials:

```sh
cp .env.example .env
# then edit .env and provide values for SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c72bd105-8134-406f-8d24-e609c43ca3b0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Blank tiles

When you drag a blank tile onto the board a dialog will appear allowing you to choose which letter it represents. The chosen letter is displayed on the tile but the tile still scores `0` points and remains a blank tile. Picking the tile back up lets you choose again on the next placement.

## Multiplayer end game

The multiplayer mode finishes once the tile bag is empty and a player has no tiles left. When this occurs the remaining tile values in each rack are subtracted from that player's score. See [docs/game_rules.md](docs/game_rules.md) for full details.
