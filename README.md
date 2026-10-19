# LaunchPad — AWS Practice Dashboard

A small, responsive static webpage for practicing AWS/Linux deployment. It uses only HTML, CSS, and vanilla JavaScript. No database, framework, build step, or API key is required.

## Features

- Add, complete, filter, and delete practice tasks
- Clear all completed tasks
- Task totals and progress statistics update automatically
- Interactive EC2 deployment checklist
- Light/dark theme toggle
- Tasks, checklist progress, and theme saved in the browser using `localStorage`
- Responsive layout for desktop and mobile

> This is a frontend-only demo. Data is saved in the current browser, not on a server. Different browsers/devices will not share the same tasks.

## Files

- `index.html` — page structure
- `style.css` — responsive styling
- `script.js` — interactive behavior

## Run locally in WSL

From the folder containing the files:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser. Stop the server with `Ctrl+C`.

You can also open `index.html` directly in a browser, but using the local server is a good deployment practice.

---

## Deploy on Ubuntu EC2 with Nginx

### 1. Launch and secure an EC2 instance

- Launch an Ubuntu EC2 instance.
- In its security group, allow inbound HTTP on TCP port `80` from the addresses you intend to serve.
- Allow SSH on TCP port `22` only from your own IP when possible.
- Keep your private SSH key secure.

### 2. Connect to the instance

From WSL, use the correct path to your private key and your instance's public IP:

```bash
chmod 600 /path/to/your-private-key.pem
ssh -i /path/to/your-private-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 3. Install and start Nginx

On the EC2 instance:

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable --now nginx
sudo systemctl status nginx
```

### 4. Upload the site from WSL

Run these commands on your local WSL terminal, from the project directory. Replace the key path and public IP:

```bash
scp -i /path/to/your-private-key.pem index.html style.css script.js ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/
```

### 5. Copy files into Nginx's web root

SSH into the instance, then run:

```bash
sudo mkdir -p /var/www/html
sudo cp /home/ubuntu/index.html /home/ubuntu/style.css /home/ubuntu/script.js /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod 644 /var/www/html/index.html /var/www/html/style.css /var/www/html/script.js
sudo nginx -t
sudo systemctl reload nginx
```

If the default Nginx site is configured to serve `/var/www/html`, visit:

```text
http://YOUR_EC2_PUBLIC_IP
```

### 6. Troubleshoot if it does not load

Run on EC2:

```bash
sudo systemctl status nginx --no-pager
sudo nginx -t
curl -I http://localhost
sudo tail -n 50 /var/log/nginx/error.log
sudo ss -lntp | grep ':80'
```

Also verify that the EC2 security group permits inbound TCP port 80 and that you're using the correct public IP.

---

## Optional: Deploy as an S3 static website

You can upload `index.html`, `style.css`, and `script.js` to an S3 bucket and enable static website hosting. For a public demo, configure access carefully and understand that an S3 website endpoint does not provide HTTPS by itself. For a more secure production setup, use CloudFront with S3 origin access control rather than making the bucket public.

## Practice challenges

1. Change the title and colors.
2. Add a priority field to each task.
3. Add a search box.
4. Configure Nginx to use a custom `server_name`.
5. Add HTTPS with a domain and a suitable certificate setup.
6. Move task storage to an API and database as a separate project.
