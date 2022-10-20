GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
BUILD_DIR=build
BINARY_NAME=steampipe
BINARY_UNIX=$(BINARY_NAME)_unix

all: clean build build-linux #install-plugins init-db
build: 
	$(GOBUILD) -o $(BUILD_DIR)/$(BINARY_NAME) -v
test: 
	$(GOTEST) -v ./...
clean: 
	$(GOCLEAN)
	rm -rf $(BUILD_DIR)
run:
	$(GOBUILD) -o $(BINARY_NAME) -v ./...
	./$(BUILD_DIR)/$(BINARY_NAME)
deps:
	# $(GOGET) github.com/sparrc/go-ping
install-plugins:
	./$(BUILD_DIR)/$(BINARY_NAME) plugin install aws azure gcp	
init-db:
	./$(BUILD_DIR)/$(BINARY_NAME) query "select * from steampipe_mod"


# Cross compilation
build-linux:
	GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BUILD_DIR)/$(BINARY_UNIX) -v
build-container: ## Build managed binary 
	sudo podman build --no-cache -v $$(pwd):/app:Z -t nucleus:$(shell basename $$(pwd)) -f Buildfile
