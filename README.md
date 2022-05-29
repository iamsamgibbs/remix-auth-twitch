# TwitchStrategy

The Twitch strategy is used to authenticate users against a Twitch account. It extends the OAuth2Strategy.

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## Usage

### Create an OAuth application

Follow the steps on [the Twitch documentation](https://dev.twitch.tv/docs/authentication/register-app) to create a new application and get a client ID and secret.

### Create the strategy instance

```ts
import { TwitchStrategy } from "remix-auth-twitch";

let twitchStrategy = new TwitchStrategy(
  {
    clientID: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
    callbackURL: "https://example.com/auth/twitch/callback",
  },
  async ({ accessToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    const user = await db.user.findUnique({
      where: { twitchId: profile.id },
    });

    if (user) {
      return { id: user.id, displayName: user.displayName };
    }

    const newUser = await db.user.create({
      data: { twitchId: profile.id, displayName: profile.display_name },
    });

    return { id: newUser.id, displayName: newUser.displayName };
  }
);

authenticator.use(twitchStrategy);
```

### Setup your routes

```tsx
// app/routes/login.tsx
export default function Login() {
  return (
    <Form action="/auth/twitch" method="post">
      <button>Login with Twitch</button>
    </Form>
  );
}
```

```tsx
// app/routes/auth/twitch.tsx
import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = () => redirect("/login");

export let action: ActionFunction = ({ request }) => {
  return authenticator.authenticate("twitch", request);
};
```

```tsx
// app/routes/auth/twitch/callback.tsx
import { LoaderFunction } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = ({ request }) => {
  return authenticator.authenticate("twitch", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
};
```
