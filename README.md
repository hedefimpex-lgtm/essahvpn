# Essah VPN

A Turkish-language Windows VPN companion with encrypted AI API key storage and direct OpenAI, Anthropic, and Google Gemini connections. Inspired by the simplicity of consumer VPN clients; not affiliated with RealVPN.

## Requirements

- Windows 10/11 x64, and the official [WireGuard for Windows](https://www.wireguard.com/install/).
- A valid WireGuard `.conf` profile from your VPN administrator/provider. This app does not supply VPN servers, subscriptions or credentials. OpenVPN profiles are not supported.
- Administrator approval to install/remove the WireGuard tunnel service.
- Your own provider API keys and API billing for AI requests. ChatGPT subscriptions do not include OpenAI API credit.

## Install and use

Run `setup.exe`, install WireGuard separately from the official website, import your profile and select **Bağlan**. Windows will request administrator approval. Select **Bağlantıyı kes** to remove the tunnel service. Closing the application leaves the tunnel running. The app manages only its `essah` tunnel.

The status reports the Windows tunnel service state, not successful handshakes, public IP changes or guaranteed internet access. Profile routes determine whether all traffic or selected destinations use the VPN. There is no kill switch, server directory or automatic reconnection policy provided by this app.

Select an AI provider, save its API key, optionally change the model ID and send a message. Each request is independent; no conversation history is sent. Models depend on provider availability and account access. Requests go directly to the selected provider over HTTPS. API keys and imported profiles are encrypted at rest using Electron safeStorage (Windows DPAPI). Do not import profiles from untrusted sources. The profile is briefly decrypted to a local file for WireGuard installation and removed afterward; WireGuard maintains its own protected service configuration.

OpenCode is a separate coding client, not an API provider. Configure it with its own supported provider keys. It and other desktop clients can use system VPN routes; this application does not install, embed or control those clients. No credentials are included.

## Development

Node.js 22+ and npm:

```sh
npm ci
npm test
npm start
```

Build the Windows installer with `npm run dist`. Output: `dist/setup.exe`. Electron Builder cross-packages the x64 Windows application and NSIS installer on Linux as well. The installer is unsigned; production distribution should add a Windows code-signing certificate. VPN service control and DPAPI require Windows and must be tested on Windows with a real profile. No live AI validation is possible without user-supplied keys.

## GitHub description

Turkish Windows VPN companion powered by WireGuard, with encrypted API key storage and OpenAI, Claude, and Gemini integrations.

## VPS management API / MCP

The Turkish UI includes VPS address, SSH user and port fields, a separate encrypted management token, an endpoint connection check and an export button for the bundled VPS component. Export the files and follow `management/KURULUM.md` (Turkish). Install the component yourself over an authenticated SSH session; it is not automatically deployed to Contabo. The management component defaults to loopback and read-only system status/service listing. A stdio MCP bridge is included for compatible desktop AI clients. Explicitly allowlisted service restart is optional and requires narrowly scoped system permissions.

Browser AI clients require their own remote connector support and may require public HTTPS and OAuth. OAuth and turnkey ChatGPT/Gemini browser integration are not included. Actual Contabo, WireGuard, AI account access and Windows installation have not been validated in the Linux build environment. The local management API authentication and actual Linux system-status tool are covered by tests.
