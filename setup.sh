# Install PM2 and start the server for the first time, make these changes permanent

# VARS
SERVER_NAME="chatterbox"
SERVER_PATH="/homebrew/typescript-chatterbox"
SERVER_COMMAND="npm start"

function download_pm2() {
	echo "Attempting to download PM2..."
	# check if PM2 is installed
	if ! command -v pm2 &> /dev/null
	then
		# download PM2
		npm install pm2 -g
		if [ $? -eq 0 ]; then
			echo "PM2 installed successfully."
		else
			echo "Failed to install PM2."
			exit 1
		fi
	else
		echo "PM2 is already installed."
	fi
}

function setup_instance() {
	echo "Setting up the instance..."
	# check if the server is running
	if ! pm2 list | grep -q $SERVER_NAME
	then
		# start the server
		pm2 start $SERVER_COMMAND --name $SERVER_NAME
		if [ $? -eq 0 ]; then
			echo "Server started successfully."
		else
			echo "Failed to start the server."
			exit 1
		fi
	else
		echo "Server is already running."
	fi
}

function save_instance() {
	echo "Saving the instance..."
	# save the instance
	pm2 save
	if [ $? -eq 0 ]; then
		echo "Instance saved successfully."
	else
		echo "Failed to save the instance."
		exit 1
	fi
}

function setup_pm2() {
	echo "Setting up PM2..."
	# download PM2
	download_pm2
	# setup the instance
	setup_instance
	# save the instance
	save_instance
}

function main() {
	# setup PM2
	setup_pm2
}

main
