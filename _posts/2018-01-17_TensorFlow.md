
---
title: "Neural Nets & Tensor Flow"
layout: post
description: Gotting curious to TensorFlow I did a deep dive in neural nets. This shows a minimal net the Java way.
comments: true
---

# Neural Nets & Tensor Flow

Having a bit of time and  gotten curious to Tensor Flow from [Adrian Colyer's morning paper][1] I decided to renew my almost 30 year old acquaintance with neural networks. I was intrigued at at the end of the eighties  but forgot all about it since it was not feasible at the time for any serious problem. Today, with computers a million times faster the story is different. Especially with TensorFlow. TensorFlow is a large mathematical library that can execute the _tensor_ formula's remotely and on special hardware like Graphic Processing Units (GPU) and special Tensor Processing Units (TPU), reaching speeds a super computer of only a number of years ago would have been jealous. Tensors, by the way, are n-dimensional matrices. I.e. scalars, vectors, matrices, volumes, and so on.

I started with TensorFlow and that meant Python. Somehow Python and me will never get friends so I tried the Java API but that was an example of either a Python programmer illegally practising Java or a junior trainee that missed the day they taught Java at university. Stupid that I am, I set out to create my own wrapper.

Now, for the kids among us, don't try this at home. Never write a library (wrapper) when you're not intricately familiar with the subject at hand. Vaguely aware of this concept I decided to first do some refreshing. Ok, maybe get some fundamentals since I never deep dived in the math of neural networks 30 years ago. (Looking back in my old books, surprisingly little has changed though.) I found an online [book about neural networks][2] that looked good and it was referred to from the TensorFlow site. Dumb as I am, I decided to write my own Java classes and not follow the Python code, telling myself it was a good learning exercise. And boy, was I right.

## Quick Guide into Neural Nets

A neural net is number of layers of neurons. Output of one neuron is relayed to the input of other neurons. The other neurons _weigh_ and _bias_ their inputs and then decide on an output value. This output value is either a result, or it is fed into the next layer. I could show a classic traditional picture of a neuronal network but that just does not work well for me. All those crossing lines are hurting my esthetic feelings. My mental model of a neuronal network is therefore the following picture.

![image](https://user-images.githubusercontent.com/200494/35111009-7ed3c104-fc7a-11e7-96cc-3665f06bb792.png)

The picture shows a 3 layer network. (In the book this would be 4 since they count the input as a layer.) It is a 3-2-4 network. Each layer has an _input cardinality_ and an _output cardinality_. We call the input cardinality _#in_ and the output cardinality _#out_.

has a table where a cell holds the _weight_ of an input _j_ to a neuron _k_ in that layer. Not shown in the picture is the _bias_ that each neuron has. For the input, a neuron multiplies each input with its special weight and sums them together and then adds the bias. We all this raw input value to the neuron _z_.

I never really had any experience with matrix multiplications so I had to follow some courses on Khan academy to get up to speed. Amazing stuff! When you structure your matrices and vectors correctly, you can do most of this in two operations. If _W_ is the weight matrix, _b_ the bias vector, and _a_ is the input vector into a layer then we can say:

      z = Wa + b

Wow, deceptively simple. Not. Matrix multiplication is clearly not my grandmother's multiplication so I did some struggling. For other souls that never wrestled with it a short primer on matrix multiplication.

## Short Primer on Matrices

When you multiply 2 matrices A * B you end up with a matrix C that gets its number of rows from A and the number of columns from B. Oh yeah and the number of columns of A must equal the number of columns of B.

      C.rows == A.rows
      C.cols == B.cols
      A.cols == B.rows

Clearly, A * B != B * A. It is very important to watch the cardinality of the matrices and the order. 

In this case, _a_ is a vector with the input values. This is actually a matrix of _#in_ x 1. That is _#in_ rows, and 1 column. So how should we store the weights _W_? If _W_ is #in x #out then cannot easily multiple it with _a_ which is #in x 1. That is, (#in x #out) * (#in x 1) is incorrect since the columns of _W_ do not match the rows of _a_. Therefore, we should make _W_ a matrix (#out x #in). Now _Wa_ is well formed and gives us a (#out x 1) vector, which exactly the dimension we need because each row now holds the value for a single neuron! Magic.


                                    a(3x1)
                                    0.50
                                    0.10
                                    0.30
              W(2x3)
              0.50   -0.5   0.30    0.29  z(2x1)
              0.10    0.2  -0.10    0.04
           
You can try this out in the wonderful Java 9 JShell! I am using the `org.jblas` as matrix library you can find on [Maven Central]. 

      jshell> import org.jblas.*
      jshell> FloatMatrix W = FloatMatrix.valueOf("0.5 -0.5 0.3; 0.1 0.2 -0.1")
      W ==> [0.500000, -0.500000, 0.300000; 0.100000, 0.200000, -0.100000]
      jshell> FloatMatrix a = FloatMatrix.valueOf("0.5;0.1;0.3")
      a ==> [0.500000; 0.100000; 0.300000]
      jshell> W.mmul(a)
      $6 ==> [0.290000; 0.040000]

## Output

Every neuron has a _function_ that takes the weighted and biased input _z_ and turns it into an output. The first models (40 years ago!) used a threshold model. If the weighted input of a row in _z_ was above a threshold, the corresponding output was 1 and otherwise 0.

![image](https://user-images.githubusercontent.com/200494/35114037-b6a5e98c-fc83-11e7-83ae-df8e0774b7e3.png)

Unfortunately, such a function has the problem that a network quickly gets unstable. A small change in weight or input can have a tremendous effect on the output, especially with multiple layers. Therefore, the _sigmoid_ function σ works much better. 


These neurons can then act as inputs to the next layer or used as is. A crucial aspect to understand is that each layer has a cardinality for the input and a cardinality for the output, and these can differ. (Extremely frustrating is that the referenced book and many other examples used layers of the same number of inputs and outputs.)

In the book I referred to this would be a 3 layer network because the input is also treated as a layer. I decided to slightly remodel it because it gives a much nicer objec oriented model. Each layer receives an input, calculates an output, and forwards it to the next layer. The last layer's outputs are the result.

With a simple neuronal network like this you could make weights and biases that would, for example, show the number of one bits in the input on the output.

     Input   Output
     000     00
     001     01
     010     01
     011     10
     100     01
     101     10
     110     10
     111     11











[1]: https://blog.acolyer.org/
[2]: http://neuralnetworksanddeeplearning.com/index.html
[3]: http://search.maven.org/#artifactdetails%7Corg.jblas%7Cjblas%7C1.2.4%7Cjar
