use chrono::{DateTime, Duration, Utc};
use ed25519_dalek::{Signature, SigningKey, VerifyingKey, Signer, Verifier};
use serde::{Deserialize, Serialize};
use base64::Engine;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PasetoClaims {
    pub sub: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub iat: String,
    pub exp: String,
}

#[derive(Clone)]
pub struct PasetoKeys {
    pub verifying_key: VerifyingKey,
    pub signing_key: Option<SigningKey>,
}

fn pae(pieces: &[&[u8]]) -> Vec<u8> {
    // PASETO Pre-Authentication Encoding
    // le64 of number of pieces, then for each piece le64(len) || piece
    fn le64(n: u64) -> [u8; 8] { n.to_le_bytes() }
    let mut out = Vec::new();
    out.extend_from_slice(&le64(pieces.len() as u64));
    for p in pieces {
        out.extend_from_slice(&le64(p.len() as u64));
        out.extend_from_slice(p);
    }
    out
}

fn b64url_nopad(data: &[u8]) -> String {
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(data)
}

fn b64url_decode_nopad(s: &str) -> Result<Vec<u8>, String> {
    base64::engine::general_purpose::URL_SAFE_NO_PAD
        .decode(s)
        .map_err(|e| format!("base64 decode error: {}", e))
}

impl PasetoKeys {
    pub fn from_base64(public_b64: &str, secret_b64: Option<&str>) -> Result<Self, String> {
        let pub_bytes = b64url_decode_nopad(public_b64)?;
        let verifying_key = VerifyingKey::from_bytes(
            pub_bytes
                .as_slice()
                .try_into()
                .map_err(|_| "public key must be 32 bytes".to_string())?,
        ).map_err(|e| format!("verifying key error: {}", e))?;

        let signing_key = if let Some(sk_b64) = secret_b64 {
            let sk_bytes = b64url_decode_nopad(sk_b64)?;
            let sk = SigningKey::from_bytes(
                sk_bytes
                    .as_slice()
                    .try_into()
                    .map_err(|_| "secret key must be 32 bytes".to_string())?,
            );
            Some(sk)
        } else { None };

        Ok(Self { verifying_key, signing_key })
    }
}

pub fn issue_v4_public(keys: &PasetoKeys, claims: &PasetoClaims) -> Result<String, String> {
    let header = b"v4.public.";
    let footer: &[u8] = b"";
    let payload = serde_json::to_vec(claims).map_err(|e| e.to_string())?;

    let signing_key = keys
        .signing_key
        .as_ref()
        .ok_or_else(|| "signing key not available".to_string())?;

    let pae_bytes = pae(&[header, &payload, footer]);
    let sig: Signature = signing_key.sign(&pae_bytes);

    let token = format!(
        "v4.public.{}.{}",
        b64url_nopad(&payload),
        b64url_nopad(&sig.to_bytes())
    );
    Ok(token)
}

pub fn verify_v4_public(keys: &PasetoKeys, token: &str) -> Result<PasetoClaims, String> {
    if !token.starts_with("v4.public.") {
        return Err("invalid token version/purpose".to_string());
    }
    let rest = &token[10..]; // after 'v4.public.'
    let parts: Vec<&str> = rest.split('.').collect();
    if parts.len() != 2 {
        return Err("invalid token format".to_string());
    }
    let payload = b64url_decode_nopad(parts[0])?;
    let sig = b64url_decode_nopad(parts[1])?;
    if sig.len() != 64 { return Err("invalid signature length".to_string()); }

    let header = b"v4.public.";
    let footer: &[u8] = b"";
    let pae_bytes = pae(&[header, &payload, footer]);

    let signature = Signature::from_bytes(
        sig.as_slice().try_into().map_err(|_| "invalid signature bytes".to_string())?
    );
    keys.verifying_key.verify(&pae_bytes, &signature)
        .map_err(|e| format!("signature verify failed: {}", e))?;

    let claims: PasetoClaims = serde_json::from_slice(&payload).map_err(|e| e.to_string())?;
    // Basic time validation
    let now = Utc::now();
    let exp: DateTime<Utc> = claims.exp.parse().map_err(|_| "exp parse".to_string())?;
    if now > exp { return Err("token expired".to_string()); }
    Ok(claims)
}

pub fn build_default_claims(sub: String, email: Option<String>, name: Option<String>) -> PasetoClaims {
    let now = Utc::now();
    let exp = now + Duration::hours(1);
    PasetoClaims {
        sub,
        email,
        name,
        iat: now.to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
        exp: exp.to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
    }
}