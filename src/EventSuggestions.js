import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';

const EventSuggestions = () => {
  return (
    <Card style={{ width: '18rem', backgroundColor:"#ffc000" }}>
      <Card.Header className='h5'>Recent popular events</Card.Header>
      <ListGroup variant="flush">
        <ListGroup.Item>Pictionary</ListGroup.Item>
        <ListGroup.Item>Google Feud</ListGroup.Item>
        <ListGroup.Item>Escape Room</ListGroup.Item>
      </ListGroup>
    </Card>
  );
}

export default EventSuggestions;

