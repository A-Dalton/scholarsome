---
sidebar_position: 3
---

# Upgrading

Upgrading Scholarsome is done by replacing the container with the latest image. Your database and media files are stored outside of the application image, so they are preserved across upgrades.

:::warning Back up your data
While upgrading does not delete any of your data, it is always recommended to back up your database and media files before upgrading, in case something goes wrong.
:::

Database migrations are run automatically by the container on startup, so no manual database steps are required.

## Upgrading from versions before v1.3.0 (v1.2.0 and earlier)

:::warning
If you are upgrading from any release prior to v1.3.0 (v1.2.0 and earlier), complete the following steps **before** upgrading.

These steps only apply to installations that use Docker Compose. If you installed Scholarsome via a Docker container, only step 1 is necessary.
:::

1. Back up your database and data volume. The v1.3.0 release performs database changes (a new table) and updates the user privileges of the data volume.
2. Update the compose file to the new one, which points to the fork's image (`a1dalton/scholarsome`) and adds container healthchecks:

   ```
   wget https://raw.githubusercontent.com/A-Dalton/scholarsome/release/compose.yml
   ```

3. If you previously uncommented the SSL port mapping to host via HTTPS, uncomment it again in the new compose file and adjust the line `# - "(your ssl port):8443"` accordingly, as described in the [SSL notes of the Installing sub-section](./installing.md#via-docker-compose). The environment file does not require any changes.

## Via Docker Compose

Navigate to the directory where your `compose.yml` and `.env` files are located.

```
cd ~/scholarsome
```

Stop the current containers.

```
docker compose down
```

Pull the updated image.

```
docker compose pull
```

Start the containers again.

```
docker compose --env-file .env up -d
```

Your data is stored in Docker volumes, which are not removed by `docker compose down`, so your installation will start up with your existing data.

## Via a Docker Container

Stop the current container.

```
docker stop scholarsome
```

Remove the stopped container, otherwise the name `scholarsome` will still be in use.

```
docker rm scholarsome
```

Pull the updated image.

```
docker pull a1dalton/scholarsome
```

Start the container again, using the same command that you used during installation. Replace `(port)` with the value you selected for `HTTP_PORT` in the environment file.

```
docker run -d --env-file .env -p (port):(port) -v ~/scholarsome-media:/data --restart=always --name scholarsome a1dalton/scholarsome
```

Your media files are stored in `~/scholarsome-media`, so they are unaffected by the upgrade. The environment file does not need to be changed.
