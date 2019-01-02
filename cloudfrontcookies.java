// Java program to demonstrate 
// generatePublic() method 

import java.security.*; 
import java.util.*; 
import java.security.spec.*; 
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
public class GFG1 { 
	public static void main(String[] argv) throws Exception 
	{ 
		try { 

			// creating the object of KeyPairGenerator 
			KeyPairGenerator kpg = KeyPairGenerator.getInstance("DSA"); 

			// initializing with 1024 
			kpg.initialize(1024); 

			// getting key pairs 
			// using generateKeyPair() method 
			KeyPair kp = kpg.genKeyPair(); 

			// getting public key 
			PublicKey prv = kp.getPublic(); 

			// getting byte data of Public key 
			byte[] publicKeyBytes = prv.getEncoded(); 

			// creating keyspec object 
			EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(getBytesFromFile("public_java.key")); 

			// creating object of keyfactory 
			KeyFactory keyFactory = KeyFactory.getInstance("RSA/ECB/PKCS1Padding"); 

			// generating Public key from the provided key spec. 
			// using generatePublic() method 
			PublicKey publicKey = keyFactory.generatePublic(publicKeySpec); 

			// printing public key 
			System.out.println("public key : " + publicKey); 
		} 

		catch (NoSuchAlgorithmException e) { 

			System.out.println("Exception thrown : " + e); 
		} 
		catch (ProviderException e) { 

			System.out.println("Exception thrown : " + e); 
		} 
	} 
	public static byte[] getBytes(InputStream inputStream) throws IOException {
        if (inputStream instanceof ByteArrayInputStream) {
            return new byte[inputStream.available()];
        }
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        byte[] bArr = new byte[1024];
        while (true) {
            int read = inputStream.read(bArr, 0, 1024);
            if (read == -1) {
                return byteArrayOutputStream.toByteArray();
            }
            byteArrayOutputStream.write(bArr, 0, read);
        }
    }
    public static byte[] getBytesFromFile(File file) throws IOException {        
        // Get the size of the file
        long length = file.length();

        // You cannot create an array using a long type.
        // It needs to be an int type.
        // Before converting to an int type, check
        // to ensure that file is not larger than Integer.MAX_VALUE.
        if (length > Integer.MAX_VALUE) {
            // File is too large
            throw new IOException("File is too large!");
        }

        // Create the byte array to hold the data
        byte[] bytes = new byte[(int)length];

        // Read in the bytes
        int offset = 0;
        int numRead = 0;

        InputStream is = new FileInputStream(file);
        try {
            while (offset < bytes.length
                   && (numRead=is.read(bytes, offset, bytes.length-offset)) >= 0) {
                offset += numRead;
            }
        } finally {
            is.close();
        }

        // Ensure all the bytes have been read in
        if (offset < bytes.length) {
            throw new IOException("Could not completely read file "+file.getName());
        }
        return bytes;
    }
} 
