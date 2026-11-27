import { AwsClient } from "aws4fetch";

export function r2AssetUploadSigner(env) {
  const {
    R2_ASSET_UPLOAD_BUCKET: bucket,
    R2_ASSET_UPLOAD_ENDPOINT: endpoint,
    R2_ASSET_UPLOAD_ACCESS_KEY_ID: accessKeyId,
    R2_ASSET_UPLOAD_SECRET_ACCESS_KEY: secretAccessKey,
  } = env;
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) return undefined;

  const signer = new AwsClient({ accessKeyId, secretAccessKey, region: "auto", service: "s3" });
  return async (key, length, headers) => {
    const path = [bucket, ...key.split("/")].map(encodeURIComponent).join("/");
    const url = new URL(`${endpoint.replace(/\/+$/, "")}/${path}`);
    url.searchParams.set("X-Amz-Expires", "600");
    const request = await signer.sign(url, {
      method: "PUT",
      headers: { ...headers, "content-length": String(length) },
      aws: { signQuery: true, allHeaders: true },
    });
    return request.url;
  };
}
