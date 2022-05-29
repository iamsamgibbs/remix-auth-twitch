import type { StrategyVerifyCallback } from "remix-auth";
import { AuthorizationError } from "remix-auth";
import {
  OAuth2Profile,
  OAuth2Strategy,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";

export interface TwitchStrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string;
  forceVerify?: boolean;
}

export interface TwitchProfile extends OAuth2Profile {
  id: string;
  login: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
  created_at: string;
  provider: string;
  display_name: string;
}

export interface TwitchExtraParams extends Record<string, string | number> {
  token_type: string;
  expires_in: number;
  scope: string;
}

export class TwitchStrategy<User> extends OAuth2Strategy<
  User,
  TwitchProfile,
  TwitchExtraParams
> {
  public name = "twitch";

  private USER_EMAIL_SCOPE = "user:read:email";
  private scope: string;
  private forceVerify: boolean;
  private userInfoURL = "https://api.twitch.tv/helix/users";

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope,
      forceVerify,
    }: TwitchStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<TwitchProfile, TwitchExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL: "https://id.twitch.tv/oauth2/authorize",
        tokenURL: "https://id.twitch.tv/oauth2/token",
      },
      verify
    );
    this.scope = scope ?? this.USER_EMAIL_SCOPE;
    this.forceVerify = forceVerify ?? false;
  }

  protected authorizationParams() {
    return new URLSearchParams({
      scope: this.scope,
      force_verify: String(this.forceVerify),
    });
  }

  protected async userProfile(accessToken: string): Promise<TwitchProfile> {
    const response = await fetch(this.userInfoURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": this.clientID,
      },
    });

    const { data } = await response.json();

    const profile: TwitchProfile = {
      id: data[0].id,
      login: data[0].login,
      type: data[0].type,
      broadcaster_type: data[0].broadcaster_type,
      description: data[0].description,
      profile_image_url: data[0].profile_image_url,
      offline_image_url: data[0].offline_image_url,
      view_count: data[0].view_count,
      email: data[0].email,
      created_at: data[0].created_at,
      provider: "twitch",
      display_name: data[0].display_name,
    };

    return profile;
  }

  protected async getAccessToken(response: Response): Promise<{
    accessToken: string;
    refreshToken: string;
    extraParams: TwitchExtraParams;
  }> {
    const data = await response.json();

    const { access_token, refresh_token, expires_in, token_type, scope } = data;

    if (!access_token) throw new AuthorizationError("Missing access token.");
    if (!refresh_token) throw new AuthorizationError("Missing refresh token.");
    if (!token_type) throw new AuthorizationError("Missing token type.");
    if (!expires_in) throw new AuthorizationError("Missing expiration.");
    if (!scope) throw new AuthorizationError("Missing scope.");

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      extraParams: { token_type, expires_in, scope },
    } as const;
  }
}
