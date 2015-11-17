[Code](https://github.com/clomax/pong_neural_net)

I was asked if it was possible to train a neural network to play a game in a
similar style to how a human would play; this is my attempt to answer that
question.

It works by collecting data from a human player, training a neural network on
that data, and importing it back into the game. Each training example records
the position and velocity of the ball, and the position that the human controlled
paddle, at a given time.

![](assets/images/pung/pung.png =500x)

Through experimentation I found that it takes approximately 100,000 training
examples, together with 50 to 100 hidden nodes, to produce acceptable
behaviour.

The neural network is a standard feed-forward network trained by the
[backpropagation](https://en.wikipedia.org/wiki/Backpropagation#Summary)
algorithm. Even though this works surprisingly well I believe it isn't the
best solution because each feed-forward cycle doesn't consider previous
datapoints. A [recurrant neural network](https://en.wikipedia.org/wiki/Recurrent_neural_network)
may produce a better result since they have an internal state that behaves like short-term
memory.
