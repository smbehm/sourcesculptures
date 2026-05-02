This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## GitHub repository (clone & hand-off)

Use a normal Git remote so you can clone on another machine or point another AI at the same codebase.

1. **Install Git** ([Windows](https://git-scm.com/download/win)), restart the terminal, then from this project folder run:

   ```powershell
   .\scripts\init-github-remote.ps1
   ```

   That checks for Git, commits any pending changes if needed, and prints the exact commands below.

2. **Create an empty repo on GitHub** (green **New** button). If this project already has files, **do not** add a README, `.gitignore`, or license on GitHub (avoid merge conflicts).

3. **Connect and push** (replace `YOUR_USER` / `REPO`, branch is usually `main`):

   ```bash
   git remote add origin https://github.com/YOUR_USER/REPO.git
   git push -u origin main
   ```

4. **Clone anywhere** (another developer or AI workspace):

   ```bash
   git clone https://github.com/YOUR_USER/REPO.git
   cd REPO
   npm install
   npm run dev
   ```

5. **Paste for troubleshooting**: the repo URL, branch name (`main`), how to run (`npm run dev` → `http://localhost:3000`), and what’s wrong. Keep secrets in `.env.local` only — never commit them (they’re gitignored).

**Optional:** [GitHub CLI](https://cli.github.com/) — `gh auth login`, then `gh repo create … --push` from the project folder.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
