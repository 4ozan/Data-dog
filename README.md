<<<<<<< HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
=======

# DataDog – Monitor Your Bandwidth, Stay Accountable

![DataDog Screenshot](https://github.com/user-attachments/assets/ee3799f5-3acf-45d0-83b5-a050c2e275f2)

**DataDog** is a lightweight browser extension that helps you track and manage your internet usage effortlessly.

---

## Getting Started

Follow these simple steps to get up and running:

### 1. Clone the Repository

```bash
git clone https://github.com/4ozan/Data-dog/
```

### 2. Open the Project Folder

Navigate into the cloned folder:

```bash
cd Data-dog
```

### 3. Load the Extension in Chromium

1. Open your Chromium-based browser (for example, Chrome, Brave, or Edge).
2. Go to the Extensions page by entering `chrome://extensions` in the address bar.
3. Enable Developer mode (top right corner).
4. Click **Load unpacked**.
5. Select the `Data-dog` folder you cloned.

---

## You're All Set

The extension will now be active and monitoring your bandwidth in real time. Use it to stay accountable with your network habits, completely free.

---

## Why Use DataDog?

* Minimal and privacy-friendly
* No setup beyond installation
* Helps track excessive data use
* Useful for teams and remote workers

---

## Feedback or Contributions

Open issues or pull requests at
[github.com/4ozan/Data-dog](https://github.com/4ozan/Data-dog)

>>>>>>> 7a7dabf0719c02c6b88ee78c5b012a2279e59608
