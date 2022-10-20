FROM golang:1.19-bullseye
RUN apt-get update && apt-get install gcc

WORKDIR /app
#RUN rm -f go.sum
RUN go mod tidy
RUN make all 
RUN chown -R 1000:1000 /app/build
