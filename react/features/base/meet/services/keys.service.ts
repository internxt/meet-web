import { aes } from '@internxt/lib';
import { Keys } from "@internxt/sdk";
import { UserSettings } from "@internxt/sdk/dist/shared/types/userSettings";
import * as openpgp from "openpgp";
import { generateNewKeys, getOpenpgp } from "./crypto/pgp.service";
import {
    BadEncodedPrivateKeyError,
    CorruptedEncryptedPrivateKeyError,
    KeysDoNotMatchError,
    WrongIterationsToEncryptPrivateKeyError,
} from "./types/keys.types";
import { CryptoUtils } from "./utils/crypto.utils";

export class KeysService {
    public static readonly instance: KeysService = new KeysService();
    MINIMAL_ENCRYPTED_KEY_LEN = 129;

    public async getKeys(password: string): Promise<Keys> {
        const {
            privateKeyArmored,
            publicKeyArmored,
            revocationCertificate,
            publicKyberKeyBase64,
            privateKyberKeyBase64,
        } = await generateNewKeys();
        const encPrivateKey = aes.encrypt(privateKeyArmored, password, CryptoUtils.getAesInit());
        const encPrivateKyberKey = aes.encrypt(privateKyberKeyBase64, password, CryptoUtils.getAesInit());

        const keys: Keys = {
            privateKeyEncrypted: encPrivateKey,
            publicKey: publicKeyArmored,
            revocationCertificate: revocationCertificate,
            ecc: {
                privateKeyEncrypted: encPrivateKey,
                publicKey: publicKeyArmored,
            },
            kyber: {
                publicKey: publicKyberKeyBase64,
                privateKeyEncrypted: encPrivateKyberKey,
            },
        };
        return keys;
    }

    public parseAndDecryptUserKeys(
        user: UserSettings,
        password: string
    ): { publicKey: string; privateKey: string; publicKyberKey: string; privateKyberKey: string } {
        const decryptedPrivateKey = this.decryptPrivateKey(user.privateKey, password);
        const privateKey = user.privateKey ? Buffer.from(decryptedPrivateKey).toString("base64") : "";

        let privateKyberKey = "";
        if (user.keys?.kyber?.privateKey) {
            privateKyberKey = this.decryptPrivateKey(user.keys.kyber.privateKey, password);
        }

        const publicKey = user.keys?.ecc?.publicKey ?? user.publicKey;
        const publicKyberKey = user.keys?.kyber?.publicKey ?? "";

        return { publicKey, privateKey, publicKyberKey, privateKyberKey };
    }

    /**
     * Checks if a private key can be decrypted with a password, otherwise it throws an error
     * @param privateKey The encrypted private key
     * @param password The password used to encrypt the private key
     * @throws {BadEncodedPrivateKeyError} If the PLAIN private key is base64 encoded (known issue introduced in the past)
     * @throws {WrongIterationsToEncryptPrivateKeyError} If the ENCRYPTED private key was encrypted using the wrong iterations number (known issue introduced in the past)
     * @throws {CorruptedEncryptedPrivateKeyError} If the ENCRYPTED private key is un-decryptable (corrupted)
     * @async
     */
    public assertPrivateKeyIsValid = async (privateKey: string, password: string): Promise<void> => {
        let privateKeyDecrypted: string | undefined;

        let badIterations = true;
        try {
            aes.decrypt(privateKey, password, 9999);
        } catch {
            badIterations = false;
        }
        if (badIterations === true) throw new WrongIterationsToEncryptPrivateKeyError();

        let badEncrypted = false;
        try {
            privateKeyDecrypted = this.decryptPrivateKey(privateKey, password);
        } catch {
            badEncrypted = true;
        }

        let hasValidFormat = false;
        try {
            if (privateKeyDecrypted !== undefined) {
                hasValidFormat = await this.isValidKey(privateKeyDecrypted);
            }
        } catch {
            /* no op */
        }

        if (badEncrypted === true) throw new CorruptedEncryptedPrivateKeyError();
        if (hasValidFormat === false) throw new BadEncodedPrivateKeyError();
    };

    /**
     * Encrypts a private key using a password
     * @param privateKey The plain private key
     * @param password The password to encrypt
     * @returns The encrypted private key
     **/
    public encryptPrivateKey = (privateKey: string, password: string): string => {
        return aes.encrypt(privateKey, password, CryptoUtils.getAesInit());
    };

    /**
     * Decrypts a private key using a password
     * @param privateKey The encrypted private key
     * @param password The password used to encrypt the private key
     * @returns The decrypted private key
     **/
    public decryptPrivateKey = (privateKey: string, password: string): string => {
        if (!privateKey || privateKey.length <= this.MINIMAL_ENCRYPTED_KEY_LEN) return "";
        else {
            try {
                const result = aes.decrypt(privateKey, password);
                return result;
            } catch (error) {
                throw new CorruptedEncryptedPrivateKeyError();
            }
        }
    };

    /**
     * Checks if a message encrypted with the public key can be decrypted with a private key, otherwise it throws an error
     * @param privateKey The plain private key
     * @param publicKey The plain public key
     * @throws {KeysDoNotMatchError} If the keys can not be used together to encrypt/decrypt a message
     * @async
     **/
    public assertValidateKeys = async (privateKey: string, publicKey: string): Promise<void> => {
        const openpgp = await getOpenpgp();
        const publicKeyArmored = await openpgp.readKey({ armoredKey: publicKey });
        const privateKeyArmored = await openpgp.readPrivateKey({ armoredKey: privateKey });

        const plainMessage = "validate-keys";
        const originalText = await openpgp.createMessage({ text: plainMessage });
        const encryptedMessage = await openpgp.encrypt({
            message: originalText,
            encryptionKeys: publicKeyArmored,
        });

        const decryptedMessage = (
            await openpgp.decrypt({
                message: await openpgp.readMessage({ armoredMessage: encryptedMessage }),
                verificationKeys: publicKeyArmored,
                decryptionKeys: privateKeyArmored,
            })
        ).data;

        if (decryptedMessage !== plainMessage) {
            throw new KeysDoNotMatchError();
        }
    };

    /**
     * Checks if a pgp key can be read
     * @param key The openpgp key to be validated
     * @returns True if it can be read, false otherwise
     * @async
     **/
    public isValidKey = async (key: string): Promise<boolean> => {
        try {
            await openpgp.readKey({ armoredKey: key });
            return true;
        } catch {
            return false;
        }
    };

    /**
     * Generates pgp keys adding an AES-encrypted private key property by using a password
     * @param password The password for encrypting the private key
     * @returns The keys { privateKeyArmored, privateKeyArmoredEncrypted, publicKeyArmored, revocationCertificate }
     * @async
     **/
    public generateNewKeysWithEncrypted = async (password: string) => {
        const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
            userIDs: [{ email: "inxt@inxt.com" }],
            curve: "ed25519",
        });

        return {
            privateKeyArmored: privateKey,
            privateKeyArmoredEncrypted: this.encryptPrivateKey(privateKey, password),
            publicKeyArmored: Buffer.from(publicKey).toString("base64"),
            revocationCertificate: Buffer.from(revocationCertificate).toString("base64"),
        };
    };
}
