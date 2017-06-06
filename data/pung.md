I was asked if it was possible to train a neural network to play a game in a
similar style to how a human would play; this is my answer to that question. I
also wanted to experiment with implementing certain subsystems that are common
in games, such as
[entity-component-system](https://en.wikipedia.org/wiki/Entity_component_system),
to understand them more clearly.

It works by collecting data from a human player, training a neural network on
that data with a separate program, and using the result to control the
opponent. Each training example records the position and velocity of the ball,
and the position that the human controlled paddle, at a given time.

<!--![](assets/images/pung/pung.png =500x)-->

<!--<div style='position:relative'><iframe src='https://gfycat.com/ifr/BrokenLonelyBangeltiger' frameborder='0' scrolling='no' width='40%' height='40%' style='position:absolute;top:0;left:0' allowfullscreen></iframe></div>-->


<div style='position:relative;padding-bottom:54%'>
        <iframe src='https://gfycat.com/ifr/BrokenLonelyBangeltiger' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0' allowfullscreen></iframe>
</div>

<p style="text-align:center; font-style: italic; margin-bottom:40px">Human player (yellow) and "Goalkeeper" AI trained with 100 hidden neurons (red)</p>

Through experimentation I found that it takes approximately 100,000 training
examples, together with 50 to 100 hidden nodes, to produce acceptable
behaviour.

The included trained neural network weights, *goalkeeper-100.csv*, is an
example of the result of training. It behaves in a similar way to a goalkeeper
by waiting in the middle and diving to meet the ball when it comes onto its
side of the court.

The neural network is a standard feed-forward network trained by the
[backpropagation](https://en.wikipedia.org/wiki/Backpropagation#Summary)
algorithm. Even though this works surprisingly well I believe it isn't the best
solution since each feed-forward cycle doesn't consider previous datapoints.
A [recurrant neural network](https://en.wikipedia.org/wiki/Recurrent_neural_network)
may produce a better result since they have an internal state that behaves like
short-term memory.

RNNs are good at tasks such as predicting the next word in a sentence given all
of the previous words, so my intuition tells me that it could also be good at
predicting where the paddle should be given where the ball is and where it's
going.

<!-- Write about entity-component-system? -->

Through this project I learnt:

* how to use libraries such as SFML and Box2D together, and how physics engines
  are used in general

* how to implement an *entity-component-system* that I kept hearing about,
  together with its pros and cons

* that performing
  [BLAS](https://en.wikipedia.org/wiki/Basic_Linear_Algebra_Subprograms)
  operations in C++ has been made much easier by the Boost library
