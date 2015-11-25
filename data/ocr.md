[Source code](https://github.com/clomax/neuralnet-digit-reader)

This was the final major project for my BSc AI & Robotics. The task was to
produce a standard feed-forward neural network that can learn to distinguish
between handwritten digits 0 to 9 and recognise digits that it had never
previously seen. The result was a model that could read unseen digits with 95%
accuracy (Humans are 96% accurate at reading digits from this dataset).

A sample from the [dataset](http://yann.lecun.com/exdb/mnist/) can be seen
below:

![](assets/images/ocr/mnist.png =400x)

When training any machine learning model you have to understand the many
pitfalls. One of the most common of these pitfalls is the tendency to overfit
on your training data such that your model struggles, or is unable, to
generalise to data it has never seen before. Below is an example of the
learning curves you would expect to see if you are overfitting on your training
data.

![](assets/images/ocr/1-mnist_learning_curve-hi_variance.png)

When your learning curves show that the gap between the error on training and
test data is receeding you know that your parameters are balanced correctly.

![](assets/images/ocr/4-mnist_learning_curves-balance.png)

Below is photo of a whiteboard I was using to check my understanding of the
steps involved in training a neural network.

![](assets/images/ocr/whiteboard_bw.jpg =800x)

