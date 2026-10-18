# FlutterFlow — one checkpoint at a time

The current action-flow screenshots and generated FlutterFlow code have not been provided. These are setup instructions, not a claim that your exact bindings were inspected or fixed.

## 1. Preserve the current project

Keep a backup/version. Identify whether this FlutterFlow project is a separate admin UI or the live website frontend. Do not replace existing Firebase Hosting assets or deploy unrelated Supabase functions.

## 2. Prove the backend is deployed

Deploy all runtime files from this package into the EXISTING Render service. Open `/health` and check version 2.0.0 and configured:true. Then use a small text-only import from the actual app with a current owner token. Until that succeeds, do not add large images or alter the database schema.

## 3. API Call: Extract Workout API

Method POST. URL: your actual Render URL + `/extract-workout`.

Variables:

| Name | Type | Value source |
|---|---|---|
| authToken | String | Current Supabase session access token |
| workoutText | String | Workout text field; default empty |
| imageBase64 | String | convertFileToBase64(selected Uploaded File); default empty |
| seriesCode | String | Required dropdown: hulk_fit / alpha / aura / goat |
| title | String | Optional owner title field; default empty |

The auth token must come from the SAME Supabase project as the database, not a Firebase ID token, public anon key, NVIDIA key or user ID. If your FlutterFlow auth menus do not expose the current Supabase access token, share the Auth settings/token-binding screenshot so the exact supported binding can be identified. Do not paste the token itself.

Headers: `Authorization: Bearer [authToken]`, `Content-Type: application/json`.

Body JSON:

```json
{
  "workoutText": "<workoutText>",
  "imageBase64": "<imageBase64>",
  "seriesCode": "<seriesCode>",
  "title": "<title>",
  "action": "import"
}
```

The angle-bracket values above are placeholders. In FlutterFlow's body editor, bind/drag the actual variable chips into those values; do NOT send literal `<imageBase64>` or the Uploaded File object. Inspect generated code or a redacted request payload showing types and lengths only.

For the first text-only check, leave imageBase64 empty. “Make Private”/proxy settings must route this call to the intended Render backend, with no provider secret embedded in the browser. Turning off FlutterFlow's private-call proxy does not remove Render's owner authentication. Verify the resulting request URL in Network instead of assuming a toggle fixed routing.

Response paths: $.success, $.message, $.error, $.code, $.programId, $.requestId, $.warnings. For an unsuccessful response, show $.error and $.code with the request ID, not an empty snackbar.

## 4. Button flow

1. Visible marker: “Import started”. Validate that a destination and either source text or image were supplied.
2. Set loading, disable repeat clicks.
3. Evaluate file conversion if an image is selected. Show only whether bytes exist and the resulting length for debugging; never the actual Base64 or JWT. An empty file/byte result must produce a local error before the call.
4. Call Extract Workout API with the bindings above; action output `extractResult`.
5. Success condition must include HTTP success AND $.success = true AND a non-empty $.programId. Show $.message, refresh the program list, and open the saved draft if possible.
6. Failure: show $.error, $.code and $.requestId, plus console exception details if a local action threw. A needs_review response retains the original extracted workout for editing; it has NOT been saved.
7. Clear loading/re-enable the button on every success, HTTP error and local exception path. Preserve input on failure for an identical retry.

Remove only the redundant old Supabase Insert Row action if the backend is the chosen saver. Do not remove unrelated app logic. Use only one save path.

Custom Function conversion is a synchronous value transformation; use its result as the String variable value. If an asynchronous Custom Action is used instead, wire its String output explicitly. Do not mix the two types. The original helper returns an empty string for missing bytes; that is not proof an image was selected. Validate first.

## 5. Prove image transport

After text-only succeeds, use one small readable screenshot, then a real phone screenshot. Check Network (All) and actual Render logs:

- No “Import started”: wrong widget handler, disabled/overlaid button or local validation.
- Marker appears, no outgoing OPTIONS/POST: inspect function evaluation/serialization and console exceptions; do not assume CORS.
- OPTIONS exists but fails: inspect exact Origin, allowed headers, endpoint, redirects and response.
- POST exists: use status/body/request ID to trace the backend stage.
- Requests hit a Heroku/Firebase proxy instead of Render: inspect the configured routing. The API tester and actual Test/Run app can take different paths; test both separately and never dismiss a fetch error as harmless.

Add the actual running app origin to Render ALLOWED_ORIGINS. Do not use a public CORS proxy or disable browser security.

Optional multi-image import uses an additional JSON array field `images`, containing Base64 Strings in screenshot order. Do not send a list of Uploaded File objects. Verify the selected model supports that number before increasing MAX_IMAGES. The current default app cap is four; it is not a provider guarantee.

## 6. What completes the real integration

A successful live test must demonstrate: selected series → actual NVIDIA extraction → canonical draft saved → exact rows visible after reopening in existing Studio → no duplicate after identical retry. Check English/Kannada and mobile display. Verify missing/expired token, non-owner, malformed/large image and provider failure show an error with loading cleared.

Use only a synthetic workout/test owner. Do not assign test content to real members. Clean up only records you created for the test. Publishing templates and assigning members are separate deliberate actions.

If the current Studio cannot represent a prescription (for example an 8–12 rep RANGE within a per-set row), a needs_review response is expected. Do not turn it into 8 or 10 to bypass validation. A compatible Studio schema/UI extension needs a separate tested change.
