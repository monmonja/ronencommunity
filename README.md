We are ronen community. We started with wiki and now we have games and raffle.

# Server security
>## SSH
> Change port number  
> Remove password login   
> Change to private/public keys  
> Add fail2ban
>## Database
> Create specific user with specific roles to different database  
> Remove root no password  
> Bind to 127.0.0.1 only
>## Server
> Only allow ssh port, http and https  
> Make sure main folder is webapp:webapp  
> Add 24x7 monitoring

# Web3 links
To get ronen on saigon network use
> https://faucet.roninchain.com/


# Config tools
to calculate raffleStartDate use
https://www.epochconverter.com/


# simulation
node .\src\backend\tests\baxie-simulation-test.mjs

# r2 backup
sudo apt update
sudo apt install -y mongodb-clients
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install -y unzip
unzip awscliv2.zip
sudo ./aws/install

sudo crontab -e
0 */6 * * * <backuppath> >> /var/log/mongo-r2-backup.log 2>&1


aws configure --profile cloudflare-r2
    AWS Access Key ID [None]: <YOUR_ACCESS_KEY_ID>
    AWS Secret Access Key [None]: <YOUR_SECRET_ACCESS_KEY>
    Default region name [None]: auto
    Default output format [None]: json

