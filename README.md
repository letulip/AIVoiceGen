# StoryVoice

StoryVoice is a React/Vite audiobook studio that generates warm narration and helps write or polish stories with Gemini.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL, choose **Add Gemini Key**, and paste a key created in [Google AI Studio](https://aistudio.google.com/app/apikey). The key is stored only in the current tab's session storage. It is sent directly to Google's Gemini API and is never included in the repository or production bundle.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds the Vite app with the correct repository base path and deploys `dist/` whenever `main` changes.

1. On GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Push or merge this change into `main`, or run **Deploy GitHub Pages** manually from the Actions tab.

For this repository the default site URL is `https://letulip.github.io/AIVoiceGen/`. A configured custom domain also works because the workflow takes its base path from GitHub Pages.

## API-key safety

GitHub Pages is static hosting and cannot safely hold server secrets. Each visitor therefore supplies their own restricted Gemini key at runtime. Do not add a Gemini key to Vite environment variables: values compiled into a Vite bundle are public.

The original Express server remains available for server-hosted development through `npm run dev:server`; the Pages build does not use it.
